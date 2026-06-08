import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { sbomService } from '../application/sbom.service';
import { createSbomSchema, sbomQuerySchema } from '../domain/sbom.types';
import { authenticate, authorize } from '@shared/middleware/auth';
import { ValidationError } from '@shared/errors';

export async function sbomRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.post('/', {
    preHandler: [authorize('SBOM_CREATE')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createSbomSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    const result = await sbomService.generate(parsed.data, request.user!.userId);
    return reply.code(201).send({ success: true, data: result });
  });

  app.get('/', {
    preHandler: [authorize('SBOM_READ')],
  }, async (request: FastifyRequest) => {
    const parsed = sbomQuerySchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    const result = await sbomService.findAll(parsed.data);
    return { success: true, ...result };
  });

  app.get('/:id', {
    preHandler: [authorize('SBOM_READ')],
  }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const result = await sbomService.findById(id);
    return { success: true, data: result };
  });

  app.delete('/:id', {
    preHandler: [authorize('SBOM_DELETE')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await sbomService.delete(id, request.user!.userId);
    return reply.code(204).send();
  });
}
