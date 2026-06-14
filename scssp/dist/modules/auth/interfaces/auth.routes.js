"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const auth_service_1 = require("../application/auth.service");
const auth_types_1 = require("../domain/auth.types");
const auth_1 = require("@shared/middleware/auth");
const env_1 = require("@shared/config/env");
const errors_1 = require("@shared/errors");
async function authRoutes(app) {
    const env = (0, env_1.getEnv)();
    const refreshCookiePath = `${env.API_PREFIX}/auth/refresh`;
    app.post('/register', {
        config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    }, async (request, reply) => {
        const parsed = auth_types_1.registerSchema.safeParse(request.body);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await auth_service_1.authService.register(parsed.data, request.ip, request.headers['user-agent']);
        reply.setCookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: refreshCookiePath,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return reply.code(201).send({
            success: true,
            data: {
                accessToken: result.accessToken,
                expiresIn: result.expiresIn,
                user: result.user,
            },
        });
    });
    app.post('/login', {
        config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    }, async (request, reply) => {
        const parsed = auth_types_1.loginSchema.safeParse(request.body);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await auth_service_1.authService.login(parsed.data, request.ip, request.headers['user-agent']);
        reply.setCookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: refreshCookiePath,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return {
            success: true,
            data: {
                accessToken: result.accessToken,
                expiresIn: result.expiresIn,
                user: result.user,
            },
        };
    });
    app.post('/refresh', async (request, reply) => {
        const token = request.cookies?.refreshToken || request.body?.refreshToken;
        if (!token)
            throw new errors_1.ValidationError('Refresh token is required');
        const result = await auth_service_1.authService.refreshToken(token, request.ip, request.headers['user-agent']);
        reply.setCookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: refreshCookiePath,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return {
            success: true,
            data: { accessToken: result.accessToken },
        };
    });
    app.post('/logout', { preHandler: [auth_1.authenticate] }, async (request, reply) => {
        const refreshTokenCookie = request.cookies?.refreshToken;
        await auth_service_1.authService.logout(request.user.userId, refreshTokenCookie, request.ip, request.headers['user-agent']);
        reply.clearCookie('refreshToken', { path: refreshCookiePath });
        return { success: true };
    });
    app.post('/forgot-password', {
        config: { rateLimit: { max: 3, timeWindow: '1 minute' } },
    }, async (request, reply) => {
        const parsed = auth_types_1.forgotPasswordSchema.safeParse(request.body);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        await auth_service_1.authService.forgotPassword(parsed.data.email);
        return { success: true, message: 'If the email exists, a password reset link has been sent' };
    });
    app.post('/reset-password', {
        config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    }, async (request, reply) => {
        const parsed = auth_types_1.resetPasswordSchema.safeParse(request.body);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        await auth_service_1.authService.resetPassword(parsed.data.token, parsed.data.password);
        return { success: true, message: 'Password reset successfully' };
    });
    app.post('/change-password', { preHandler: [auth_1.authenticate] }, async (request, reply) => {
        const parsed = auth_types_1.changePasswordSchema.safeParse(request.body);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        await auth_service_1.authService.changePassword(request.user.userId, parsed.data.currentPassword, parsed.data.newPassword);
        return { success: true, message: 'Password changed successfully' };
    });
}
//# sourceMappingURL=auth.routes.js.map