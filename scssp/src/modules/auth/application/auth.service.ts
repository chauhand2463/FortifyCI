import { hash, verify } from '@node-rs/argon2';
import crypto from 'crypto';
import { getEnv } from '@shared/config/env';
import { getPrisma } from '@shared/database/prisma';
import { generateAccessToken, generateRefreshToken, verifyToken, type TokenPayload } from '@shared/utils/jwt';
import { auditService } from '@modules/audit/application/audit.service';
import { sendEmail } from '@shared/notifications/email';
import { UnauthorizedError, ConflictError, ValidationError } from '@shared/errors';
import type { RegisterDto, LoginDto, AuthResponse, TokenPair } from '../domain/auth.types';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class AuthService {
  private async createTokenPair(
    user: { id: string; email: string; username: string; role: { name: string; permissions: { permission: { name: string } }[] } },
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number; permissions: string[] }> {
    const permissions = user.role.permissions.map((rp) => rp.permission.name);
    const tokenPayload = {
      sub: user.id,
      userId: user.id,
      role: user.role.name,
      permissions: permissions as string[],
    };

    const [accessToken, refreshToken] = await Promise.all([
      generateAccessToken(tokenPayload),
      generateRefreshToken(tokenPayload),
    ]);

    const env = getEnv();
    const expiresIn = parseDuration(env.JWT_ACCESS_TOKEN_EXPIRY);

    return { accessToken, refreshToken, expiresIn, permissions };
  }

  private async persistRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const env = getEnv();
    const expiresAt = new Date(Date.now() + parseDuration(env.JWT_REFRESH_TOKEN_EXPIRY) * 1000);
    const tokenHash = hashToken(refreshToken);

    const prisma = getPrisma();
    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  private async revokeRefreshToken(tokenHash: string): Promise<void> {
    const prisma = getPrisma();
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeAllUserTokens(userId: string): Promise<void> {
    const prisma = getPrisma();
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const prisma = getPrisma();

    const existingEmail = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictError('Email already registered');

    const existingUsername = await prisma.user.findUnique({ where: { username: dto.username } });
    if (existingUsername) throw new ConflictError('Username already taken');

    const env = getEnv();
    const passwordHash = await hash(dto.password, {
      algorithm: 2,
      memoryCost: env.ARGON2_MEMORY_COST,
      timeCost: env.ARGON2_TIME_COST,
      parallelism: env.ARGON2_PARALLELISM,
    });

    const viewerRole = await prisma.role.findUnique({
      where: { name: 'VIEWER' },
      include: { permissions: { include: { permission: true } } },
    });
    if (!viewerRole) throw new ValidationError('Default role not found. Run seed first.');

    const user = await prisma.user.create({
      data: { email: dto.email, username: dto.username, passwordHash, roleId: viewerRole.id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    const { accessToken, refreshToken, expiresIn, permissions } = await this.createTokenPair(user);
    await this.persistRefreshToken(user.id, refreshToken);

    await auditService.record({
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user.id,
      description: `User registered: ${user.email}`,
      ipAddress,
      userAgent,
      userId: user.id,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role.name,
        permissions: permissions as string[],
      },
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (!user || !user.isActive) throw new UnauthorizedError('Invalid credentials');

    const valid = await verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const { accessToken, refreshToken, expiresIn, permissions } = await this.createTokenPair(user);
    await this.persistRefreshToken(user.id, refreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await auditService.record({
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      description: `User logged in: ${user.email}`,
      ipAddress,
      userAgent,
      userId: user.id,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role.name,
        permissions: permissions as string[],
      },
    };
  }

  async refreshToken(refreshTokenJwt: string, ipAddress?: string, userAgent?: string): Promise<TokenPair> {
    const prisma = getPrisma();

    let payload: TokenPayload;
    try {
      payload = await verifyToken(refreshTokenJwt);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') throw new UnauthorizedError('Invalid token type');

    const tokenHash = hashToken(refreshTokenJwt);

    const storedToken = await prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: {
        user: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    });

    if (!storedToken) throw new UnauthorizedError('Refresh token not found');

    if (storedToken.revokedAt) {
      await this.revokeAllUserTokens(storedToken.userId);
      await auditService.record({
        action: 'REPLAY_ATTACK_DETECTED',
        entity: 'User',
        entityId: storedToken.userId,
        description: `Replay attack detected for user: ${storedToken.user.email}. All tokens revoked.`,
        ipAddress,
        userAgent,
        userId: storedToken.userId,
      });
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    await this.revokeRefreshToken(tokenHash);

    const user = storedToken.user;
    const permissions = user.role.permissions.map((rp) => rp.permission.name);
    const tokenPayload = {
      sub: user.id,
      userId: user.id,
      role: user.role.name,
      permissions: permissions as string[],
    };

    const [newAccessToken, newRefreshToken] = await Promise.all([
      generateAccessToken(tokenPayload),
      generateRefreshToken(tokenPayload),
    ]);

    await this.persistRefreshToken(user.id, newRefreshToken);

    await auditService.record({
      action: 'TOKEN_REFRESHED',
      entity: 'User',
      entityId: user.id,
      description: `Token refreshed for user: ${user.email}`,
      ipAddress,
      userAgent,
      userId: user.id,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async forgotPassword(email: string): Promise<void> {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });

    const env = getEnv();
    const resetUrl = `${env.CORS_ORIGIN === '*' ? 'http://localhost:4000' : env.CORS_ORIGIN}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'FortifyCI - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a73e8;">FortifyCI - Password Reset</h2>
          <p>You requested a password reset for your FortifyCI account.</p>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1a73e8; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    await auditService.record({
      action: 'PASSWORD_RESET_REQUESTED',
      entity: 'User',
      entityId: user.id,
      description: `Password reset requested for: ${user.email}`,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const prisma = getPrisma();
    const user = await prisma.user.findFirst({
      where: { passwordResetToken: token, passwordResetExpires: { gte: new Date() } },
    });

    if (!user) throw new ValidationError('Invalid or expired reset token');

    const env = getEnv();
    const passwordHash = await hash(newPassword, {
      algorithm: 2,
      memoryCost: env.ARGON2_MEMORY_COST,
      timeCost: env.ARGON2_TIME_COST,
      parallelism: env.ARGON2_PARALLELISM,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
    });

    await this.revokeAllUserTokens(user.id);

    await auditService.record({
      action: 'PASSWORD_RESET_COMPLETED',
      entity: 'User',
      entityId: user.id,
      description: `Password reset completed for: ${user.email}`,
    });
  }

  async logout(userId: string, refreshTokenJwt?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    if (refreshTokenJwt) {
      const tokenHash = hashToken(refreshTokenJwt);
      await this.revokeRefreshToken(tokenHash);
    } else {
      await this.revokeAllUserTokens(userId);
    }

    await auditService.record({
      action: 'USER_LOGOUT',
      entity: 'User',
      entityId: userId,
      description: 'User logged out',
      ipAddress,
      userAgent,
      userId,
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedError('User not found');

    const valid = await verify(user.passwordHash, currentPassword);
    if (!valid) throw new UnauthorizedError('Current password is incorrect');

    const env = getEnv();
    const passwordHash = await hash(newPassword, {
      algorithm: 2,
      memoryCost: env.ARGON2_MEMORY_COST,
      timeCost: env.ARGON2_TIME_COST,
      parallelism: env.ARGON2_PARALLELISM,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.revokeAllUserTokens(userId);

    await auditService.record({
      action: 'PASSWORD_CHANGED',
      entity: 'User',
      entityId: userId,
      description: 'Password changed',
      userId,
    });
  }
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 900;
  const value = parseInt(match[1]!, 10);
  switch (match[2]) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 900;
  }
}

export const authService = new AuthService();
