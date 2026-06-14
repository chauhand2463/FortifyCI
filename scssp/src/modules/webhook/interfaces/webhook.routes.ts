import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { webhookService } from '../application/webhook.service';
import { authenticate, authorize } from '@shared/middleware/auth';
import { ValidationError } from '@shared/errors';

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  app.post('/', { preHandler: [authenticate, authorize('WEBHOOK_MANAGE')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    if (!body.name || !body.url || !body.secret || !body.events) throw new ValidationError('name, url, secret, and events required');
    const result = await webhookService.create(body, request.user!.userId);
    return reply.code(201).send({ success: true, data: result });
  });

  app.get('/', { preHandler: [authenticate, authorize('WEBHOOK_MANAGE')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await webhookService.findAll();
    return { success: true, data: result };
  });

  app.get<{ Params: { id: string } }>('/:id', { preHandler: [authenticate, authorize('WEBHOOK_MANAGE')] }, async (request, reply) => {
    const result = await webhookService.findById(request.params.id);
    return { success: true, data: result };
  });

  app.patch<{ Params: { id: string } }>('/:id', { preHandler: [authenticate, authorize('WEBHOOK_MANAGE')] }, async (request, reply) => {
    const result = await webhookService.update(request.params.id, request.body as any, request.user!.userId);
    return { success: true, data: result };
  });

  app.delete<{ Params: { id: string } }>('/:id', { preHandler: [authenticate, authorize('WEBHOOK_MANAGE')] }, async (request, reply) => {
    await webhookService.delete(request.params.id, request.user!.userId);
    return { success: true };
  });

  app.post<{ Params: { id: string } }>('/:id/test', { preHandler: [authenticate, authorize('WEBHOOK_MANAGE')] }, async (request, reply) => {
    const result = await webhookService.sendTest(request.params.id);
    return { success: true, data: result };
  });
}
