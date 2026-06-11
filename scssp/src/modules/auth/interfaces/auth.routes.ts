import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../application/auth.service';
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from '../domain/auth.types';
import { authenticate } from '@shared/middleware/auth';
import { getEnv } from '@shared/config/env';
import { ValidationError } from '@shared/errors';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const env = getEnv();
  const refreshCookiePath = `${env.API_PREFIX}/auth/refresh`;

  app.post('/register', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    const result = await authService.register(
      parsed.data,
      request.ip,
      request.headers['user-agent'],
    );

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
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    const result = await authService.login(
      parsed.data,
      request.ip,
      request.headers['user-agent'],
    );

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

  app.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies?.refreshToken || (request.body as { refreshToken?: string })?.refreshToken;
    if (!token) throw new ValidationError('Refresh token is required');

    const result = await authService.refreshToken(
      token,
      request.ip,
      request.headers['user-agent'],
    );

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

  app.post('/logout', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const refreshTokenCookie = request.cookies?.refreshToken;
    await authService.logout(
      request.user!.userId,
      refreshTokenCookie,
      request.ip,
      request.headers['user-agent'],
    );

    reply.clearCookie('refreshToken', { path: refreshCookiePath });

    return { success: true };
  });

  app.post('/forgot-password', {
    config: { rateLimit: { max: 3, timeWindow: '1 minute' } },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = forgotPasswordSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    await authService.forgotPassword(parsed.data.email);

    return { success: true, message: 'If the email exists, a password reset link has been sent' };
  });

  app.post('/reset-password', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = resetPasswordSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    await authService.resetPassword(parsed.data.token, parsed.data.password);

    return { success: true, message: 'Password reset successfully' };
  });

  app.post('/change-password', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = changePasswordSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    await authService.changePassword(request.user!.userId, parsed.data.currentPassword, parsed.data.newPassword);

    return { success: true, message: 'Password changed successfully' };
  });
}
