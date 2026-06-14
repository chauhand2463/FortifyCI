import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { policyService } from '../application/policy.service';
import { authenticate, authorize } from '@shared/middleware/auth';
import { ValidationError } from '@shared/errors';

export async function policyRoutes(app: FastifyInstance): Promise<void> {
  app.post('/', { preHandler: [authenticate, authorize('POLICY_MANAGE')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await policyService.create(request.body as any, request.user!.userId);
    return reply.code(201).send({ success: true, data: result });
  });

  app.get('/', { preHandler: [authenticate, authorize('VULNERABILITY_READ')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await policyService.findAll();
    return { success: true, data: result };
  });

  app.get<{ Params: { id: string } }>('/:id', { preHandler: [authenticate, authorize('VULNERABILITY_READ')] }, async (request, reply) => {
    const result = await policyService.findById(request.params.id);
    return { success: true, data: result };
  });

  app.patch<{ Params: { id: string } }>('/:id', { preHandler: [authenticate, authorize('POLICY_MANAGE')] }, async (request, reply) => {
    const result = await policyService.update(request.params.id, request.body as any, request.user!.userId);
    return { success: true, data: result };
  });

  app.delete<{ Params: { id: string } }>('/:id', { preHandler: [authenticate, authorize('POLICY_MANAGE')] }, async (request, reply) => {
    await policyService.delete(request.params.id, request.user!.userId);
    return { success: true };
  });

  app.post<{ Params: { id: string } }>('/:id/set-default', { preHandler: [authenticate, authorize('POLICY_MANAGE')] }, async (request, reply) => {
    const result = await policyService.setDefault(request.params.id, request.user!.userId);
    return { success: true, data: result };
  });

  app.get<{ Params: { id: string; imageId: string } }>('/:id/evaluate/:imageId', { preHandler: [authenticate, authorize('VULNERABILITY_READ')] }, async (request, reply) => {
    const result = await policyService.evaluate(request.params.imageId, request.params.id);
    return { success: true, data: result };
  });

  app.get<{ Params: { imageId: string } }>('/evaluate/:imageId', { preHandler: [authenticate, authorize('VULNERABILITY_READ')] }, async (request, reply) => {
    const result = await policyService.evaluate(request.params.imageId);
    return { success: true, data: result };
  });
}
