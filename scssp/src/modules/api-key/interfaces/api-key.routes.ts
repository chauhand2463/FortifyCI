import { FastifyInstance, FastifyRequest } from 'fastify';
import { apiKeyService } from '../application/api-key.service';
import { createApiKeySchema, apiKeyQuerySchema } from '../domain/api-key.types';
import { authenticate, authorize } from '@shared/middleware/auth';
import { ValidationError } from '@shared/errors';

export async function apiKeyRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.post('/', {
    preHandler: [authorize('API_KEY_CREATE')],
  }, async (request: FastifyRequest, reply) => {
    const parsed = createApiKeySchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    const result = await apiKeyService.create(parsed.data, request.user!.userId);
    return reply.code(201).send({ success: true, data: result });
  });

  app.get('/', {
    preHandler: [authorize('API_KEY_READ')],
  }, async (request: FastifyRequest) => {
    const parsed = apiKeyQuerySchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    const result = await apiKeyService.findAll(parsed.data, request.user!.userId);
    return { success: true, ...result };
  });

  app.delete('/:id', {
    preHandler: [authorize('API_KEY_DELETE')],
  }, async (request: FastifyRequest, reply) => {
    const { id } = request.params as { id: string };
    await apiKeyService.delete(id, request.user!.userId);
    return reply.code(204).send();
  });
}
