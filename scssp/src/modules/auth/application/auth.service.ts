import * as argon2 from 'argon2';
import { getEnv } from '@shared/config/env';
import { getPrisma } from '@shared/database/prisma';
import { generateAccessToken, generateRefreshToken, verifyToken, type TokenPayload } from '@shared/utils/jwt';
import { auditService } from '@modules/audit/application/audit.service';
import { UnauthorizedError, ConflictError, ValidationError } from '@shared/errors';
import type { RegisterDto, LoginDto, AuthResponse, TokenPair } from '../domain/auth.types';

export class AuthService {
  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const prisma = getPrisma();

    const existingEmail = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictError('Email already registered');

    const existingUsername = await prisma.user.findUnique({ where: { username: dto.username } });
    if (existingUsername) throw new ConflictError('Username already taken');

    const env = getEnv();
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
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
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        roleId: viewerRole.id,
      },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });

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

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    await auditService.record({
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user.id,
      description: `User registered: ${user.email}`,
      ipAddress,
      userAgent,
      userId: user.id,
    });

    const envJwt = getEnv();
    const expiresIn = parseDuration(envJwt.JWT_ACCESS_TOKEN_EXPIRY);

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
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });

    if (!user || !user.isActive) throw new UnauthorizedError('Invalid credentials');

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

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

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, lastLoginAt: new Date() },
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

    const env = getEnv();
    const expiresIn = parseDuration(env.JWT_ACCESS_TOKEN_EXPIRY);

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

  async refreshToken(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<TokenPair> {
    const prisma = getPrisma();

    let payload: TokenPayload;
    try {
      payload = await verifyToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') throw new UnauthorizedError('Invalid token type');

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });

    if (!user || !user.isActive || user.refreshToken !== refreshToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

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

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

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

  async logout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const prisma = getPrisma();
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    await auditService.record({
      action: 'USER_LOGOUT',
      entity: 'User',
      entityId: userId,
      description: `User logged out`,
      ipAddress,
      userAgent,
      userId,
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedError('User not found');

    const valid = await argon2.verify(user.passwordHash, currentPassword);
    if (!valid) throw new UnauthorizedError('Current password is incorrect');

    const env = getEnv();
    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: env.ARGON2_MEMORY_COST,
      timeCost: env.ARGON2_TIME_COST,
      parallelism: env.ARGON2_PARALLELISM,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, refreshToken: null },
    });

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
