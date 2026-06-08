import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { userService } from '../application/user.service';
import { createUserSchema, updateUserSchema, userQuerySchema } from '../domain/user.types';
import { authenticate, authorize } from '@shared/middleware/auth';
import { ValidationError } from '@shared/errors';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.post('/', {
    preHandler: [authorize('USER_CREATE')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createUserSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    const result = await userService.create(parsed.data, request.user!.userId);
    return reply.code(201).send({ success: true, data: result });
  });

  app.get('/', {
    preHandler: [authorize('USER_READ')],
  }, async (request: FastifyRequest) => {
    const parsed = userQuerySchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    const result = await userService.findAll(parsed.data);
    return { success: true, ...result };
  });

  app.get('/me', async (request: FastifyRequest) => {
    const result = await userService.findById(request.user!.userId);
    return { success: true, data: result };
  });

  app.get('/:id', {
    preHandler: [authorize('USER_READ')],
  }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const result = await userService.findById(id);
    return { success: true, data: result };
  });

  app.patch('/:id', {
    preHandler: [authorize('USER_UPDATE')],
  }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const parsed = updateUserSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    const result = await userService.update(id, parsed.data, request.user!.userId);
    return { success: true, data: result };
  });

  app.delete('/:id', {
    preHandler: [authorize('USER_DELETE')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await userService.delete(id, request.user!.userId);
    return reply.code(204).send();
  });
}
