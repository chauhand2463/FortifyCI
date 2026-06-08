import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { imageService } from '../application/image.service';
import { registerImageSchema, imageQuerySchema } from '../domain/image.types';
import { authenticate, authorize } from '@shared/middleware/auth';
import { ValidationError } from '@shared/errors';

export async function imageRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.post('/', {
    preHandler: [authorize('IMAGE_REGISTER')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = registerImageSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    const result = await imageService.register(parsed.data, request.user!.userId);
    return reply.code(201).send({ success: true, data: result });
  });

  app.get('/', {
    preHandler: [authorize('IMAGE_READ')],
  }, async (request: FastifyRequest) => {
    const parsed = imageQuerySchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    const result = await imageService.findAll(parsed.data);
    return { success: true, ...result };
  });

  app.get('/:id', {
    preHandler: [authorize('IMAGE_READ')],
  }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const result = await imageService.findById(id);
    return { success: true, data: result };
  });

  app.delete('/:id', {
    preHandler: [authorize('IMAGE_DELETE')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await imageService.delete(id, request.user!.userId);
    return reply.code(204).send();
  });
}
