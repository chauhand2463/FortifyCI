"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const argon2_1 = require("@node-rs/argon2");
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("@shared/config/env");
const prisma_1 = require("@shared/database/prisma");
const jwt_1 = require("@shared/utils/jwt");
const audit_service_1 = require("@modules/audit/application/audit.service");
const email_1 = require("@shared/notifications/email");
const errors_1 = require("@shared/errors");
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
class AuthService {
    async createTokenPair(user) {
        const permissions = user.role.permissions.map((rp) => rp.permission.name);
        const tokenPayload = {
            sub: user.id,
            userId: user.id,
            role: user.role.name,
            permissions: permissions,
        };
        const [accessToken, refreshToken] = await Promise.all([
            (0, jwt_1.generateAccessToken)(tokenPayload),
            (0, jwt_1.generateRefreshToken)(tokenPayload),
        ]);
        const env = (0, env_1.getEnv)();
        const expiresIn = parseDuration(env.JWT_ACCESS_TOKEN_EXPIRY);
        return { accessToken, refreshToken, expiresIn, permissions };
    }
    async persistRefreshToken(userId, refreshToken) {
        const env = (0, env_1.getEnv)();
        const expiresAt = new Date(Date.now() + parseDuration(env.JWT_REFRESH_TOKEN_EXPIRY) * 1000);
        const tokenHash = hashToken(refreshToken);
        const prisma = (0, prisma_1.getPrisma)();
        await prisma.refreshToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt,
            },
        });
    }
    async revokeRefreshToken(tokenHash) {
        const prisma = (0, prisma_1.getPrisma)();
        await prisma.refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async revokeAllUserTokens(userId) {
        const prisma = (0, prisma_1.getPrisma)();
        await prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async register(dto, ipAddress, userAgent) {
        const prisma = (0, prisma_1.getPrisma)();
        const existingEmail = await prisma.user.findUnique({ where: { email: dto.email } });
        if (existingEmail)
            throw new errors_1.ConflictError('Email already registered');
        const existingUsername = await prisma.user.findUnique({ where: { username: dto.username } });
        if (existingUsername)
            throw new errors_1.ConflictError('Username already taken');
        const env = (0, env_1.getEnv)();
        const passwordHash = await (0, argon2_1.hash)(dto.password, {
            algorithm: 2,
            memoryCost: env.ARGON2_MEMORY_COST,
            timeCost: env.ARGON2_TIME_COST,
            parallelism: env.ARGON2_PARALLELISM,
        });
        const viewerRole = await prisma.role.findUnique({
            where: { name: 'VIEWER' },
            include: { permissions: { include: { permission: true } } },
        });
        if (!viewerRole)
            throw new errors_1.ValidationError('Default role not found. Run seed first.');
        const user = await prisma.user.create({
            data: { email: dto.email, username: dto.username, passwordHash, roleId: viewerRole.id },
            include: { role: { include: { permissions: { include: { permission: true } } } } },
        });
        const { accessToken, refreshToken, expiresIn, permissions } = await this.createTokenPair(user);
        await this.persistRefreshToken(user.id, refreshToken);
        await audit_service_1.auditService.record({
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
                permissions: permissions,
            },
        };
    }
    async login(dto, ipAddress, userAgent) {
        const prisma = (0, prisma_1.getPrisma)();
        const user = await prisma.user.findUnique({
            where: { email: dto.email },
            include: { role: { include: { permissions: { include: { permission: true } } } } },
        });
        if (!user || !user.isActive)
            throw new errors_1.UnauthorizedError('Invalid credentials');
        const valid = await (0, argon2_1.verify)(user.passwordHash, dto.password);
        if (!valid)
            throw new errors_1.UnauthorizedError('Invalid credentials');
        const { accessToken, refreshToken, expiresIn, permissions } = await this.createTokenPair(user);
        await this.persistRefreshToken(user.id, refreshToken);
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        await audit_service_1.auditService.record({
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
                permissions: permissions,
            },
        };
    }
    async refreshToken(refreshTokenJwt, ipAddress, userAgent) {
        const prisma = (0, prisma_1.getPrisma)();
        let payload;
        try {
            payload = await (0, jwt_1.verifyToken)(refreshTokenJwt);
        }
        catch {
            throw new errors_1.UnauthorizedError('Invalid or expired refresh token');
        }
        if (payload.type !== 'refresh')
            throw new errors_1.UnauthorizedError('Invalid token type');
        const tokenHash = hashToken(refreshTokenJwt);
        const storedToken = await prisma.refreshToken.findFirst({
            where: { tokenHash },
            include: {
                user: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
            },
        });
        if (!storedToken)
            throw new errors_1.UnauthorizedError('Refresh token not found');
        if (storedToken.revokedAt) {
            await this.revokeAllUserTokens(storedToken.userId);
            await audit_service_1.auditService.record({
                action: 'REPLAY_ATTACK_DETECTED',
                entity: 'User',
                entityId: storedToken.userId,
                description: `Replay attack detected for user: ${storedToken.user.email}. All tokens revoked.`,
                ipAddress,
                userAgent,
                userId: storedToken.userId,
            });
            throw new errors_1.UnauthorizedError('Refresh token has been revoked');
        }
        if (storedToken.expiresAt < new Date()) {
            throw new errors_1.UnauthorizedError('Refresh token has expired');
        }
        await this.revokeRefreshToken(tokenHash);
        const user = storedToken.user;
        const permissions = user.role.permissions.map((rp) => rp.permission.name);
        const tokenPayload = {
            sub: user.id,
            userId: user.id,
            role: user.role.name,
            permissions: permissions,
        };
        const [newAccessToken, newRefreshToken] = await Promise.all([
            (0, jwt_1.generateAccessToken)(tokenPayload),
            (0, jwt_1.generateRefreshToken)(tokenPayload),
        ]);
        await this.persistRefreshToken(user.id, newRefreshToken);
        await audit_service_1.auditService.record({
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
    async forgotPassword(email) {
        const prisma = (0, prisma_1.getPrisma)();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return;
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordResetToken: token, passwordResetExpires: expires },
        });
        const env = (0, env_1.getEnv)();
        const resetUrl = `${env.CORS_ORIGIN === '*' ? 'http://localhost:4000' : env.CORS_ORIGIN}/reset-password?token=${token}`;
        await (0, email_1.sendEmail)({
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
        await audit_service_1.auditService.record({
            action: 'PASSWORD_RESET_REQUESTED',
            entity: 'User',
            entityId: user.id,
            description: `Password reset requested for: ${user.email}`,
        });
    }
    async resetPassword(token, newPassword) {
        const prisma = (0, prisma_1.getPrisma)();
        const user = await prisma.user.findFirst({
            where: { passwordResetToken: token, passwordResetExpires: { gte: new Date() } },
        });
        if (!user)
            throw new errors_1.ValidationError('Invalid or expired reset token');
        const env = (0, env_1.getEnv)();
        const passwordHash = await (0, argon2_1.hash)(newPassword, {
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
        await audit_service_1.auditService.record({
            action: 'PASSWORD_RESET_COMPLETED',
            entity: 'User',
            entityId: user.id,
            description: `Password reset completed for: ${user.email}`,
        });
    }
    async logout(userId, refreshTokenJwt, ipAddress, userAgent) {
        if (refreshTokenJwt) {
            const tokenHash = hashToken(refreshTokenJwt);
            await this.revokeRefreshToken(tokenHash);
        }
        else {
            await this.revokeAllUserTokens(userId);
        }
        await audit_service_1.auditService.record({
            action: 'USER_LOGOUT',
            entity: 'User',
            entityId: userId,
            description: 'User logged out',
            ipAddress,
            userAgent,
            userId,
        });
    }
    async changePassword(userId, currentPassword, newPassword) {
        const prisma = (0, prisma_1.getPrisma)();
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new errors_1.UnauthorizedError('User not found');
        const valid = await (0, argon2_1.verify)(user.passwordHash, currentPassword);
        if (!valid)
            throw new errors_1.UnauthorizedError('Current password is incorrect');
        const env = (0, env_1.getEnv)();
        const passwordHash = await (0, argon2_1.hash)(newPassword, {
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
        await audit_service_1.auditService.record({
            action: 'PASSWORD_CHANGED',
            entity: 'User',
            entityId: userId,
            description: 'Password changed',
            userId,
        });
    }
}
exports.AuthService = AuthService;
function parseDuration(duration) {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match)
        return 900;
    const value = parseInt(match[1], 10);
    switch (match[2]) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 3600;
        case 'd': return value * 86400;
        default: return 900;
    }
}
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map