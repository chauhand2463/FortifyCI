import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { roleService } from '../application/role.service';
import { createRoleSchema, updateRoleSchema } from '../domain/role.types';
import { authenticate, authorize } from '@shared/middleware/auth';
import { ValidationError } from '@shared/errors';

export async function roleRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.post('/', {
    preHandler: [authorize('ROLE_CREATE')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createRoleSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    const result = await roleService.create(parsed.data, request.user!.userId);
    return reply.code(201).send({ success: true, data: result });
  });

  app.get('/', {
    preHandler: [authorize('ROLE_READ')],
  }, async (request: FastifyRequest) => {
    const query = request.query as { page?: string; limit?: string };
    const result = await roleService.findAll(
      Number(query.page) || 1,
      Number(query.limit) || 20,
    );
    return { success: true, ...result };
  });

  app.get('/:id', {
    preHandler: [authorize('ROLE_READ')],
  }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const result = await roleService.findById(id);
    return { success: true, data: result };
  });

  app.patch('/:id', {
    preHandler: [authorize('ROLE_UPDATE')],
  }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const parsed = updateRoleSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    const result = await roleService.update(id, parsed.data, request.user!.userId);
    return { success: true, data: result };
  });

  app.delete('/:id', {
    preHandler: [authorize('ROLE_DELETE')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await roleService.delete(id, request.user!.userId);
    return reply.code(204).send();
  });
}
