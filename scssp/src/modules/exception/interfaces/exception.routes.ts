import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { exceptionService } from '../application/exception.service';
import { authenticate, authorize } from '@shared/middleware/auth';
import { ValidationError } from '@shared/errors';

export async function exceptionRoutes(app: FastifyInstance): Promise<void> {
  app.post('/', { preHandler: [authenticate, authorize('VULNERABILITY_EXCEPTION')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    if (!body.cveId || !body.reason || !body.expiresAt) throw new ValidationError('cveId, reason, and expiresAt required');
    const result = await exceptionService.create(body, request.user!.userId);
    return reply.code(201).send({ success: true, data: result });
  });

  app.get('/', { preHandler: [authenticate, authorize('VULNERABILITY_READ')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const result = await exceptionService.findAll({
      isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
      cveId: query.cveId,
      page: parseInt(query.page || '1'),
      limit: parseInt(query.limit || '20'),
    });
    return { success: true, data: result.items, total: result.total };
  });

  app.get<{ Params: { id: string } }>('/:id', { preHandler: [authenticate, authorize('VULNERABILITY_READ')] }, async (request, reply) => {
    const result = await exceptionService.findById(request.params.id);
    return { success: true, data: result };
  });

  app.post<{ Params: { id: string } }>('/:id/approve', { preHandler: [authenticate, authorize('VULNERABILITY_EXCEPTION')] }, async (request, reply) => {
    const result = await exceptionService.approve(request.params.id, request.user!.userId);
    return { success: true, data: result };
  });

  app.post<{ Params: { id: string } }>('/:id/revoke', { preHandler: [authenticate, authorize('VULNERABILITY_EXCEPTION')] }, async (request, reply) => {
    const result = await exceptionService.revoke(request.params.id, request.user!.userId);
    return { success: true, data: result };
  });
}
