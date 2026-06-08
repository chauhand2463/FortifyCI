import { FastifyInstance, FastifyRequest } from 'fastify';
import { notificationService } from '../application/notification.service';
import { notificationQuerySchema } from '../domain/notification.types';
import { authenticate, authorize } from '@shared/middleware/auth';
import { ValidationError } from '@shared/errors';

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/', {
    preHandler: [authorize('NOTIFICATION_READ')],
  }, async (request: FastifyRequest) => {
    const parsed = notificationQuerySchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    const result = await notificationService.findAll(parsed.data, request.user!.userId);
    return { success: true, ...result };
  });

  app.get('/unread-count', {
    preHandler: [authorize('NOTIFICATION_READ')],
  }, async (request: FastifyRequest) => {
    const count = await notificationService.getUnreadCount(request.user!.userId);
    return { success: true, data: { count } };
  });

  app.patch('/:id/read', {
    preHandler: [authorize('NOTIFICATION_MANAGE')],
  }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    await notificationService.markAsRead(id, request.user!.userId);
    return { success: true };
  });

  app.post('/read-all', {
    preHandler: [authorize('NOTIFICATION_MANAGE')],
  }, async (request: FastifyRequest) => {
    await notificationService.markAllAsRead(request.user!.userId);
    return { success: true };
  });
}
