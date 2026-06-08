import { FastifyInstance, FastifyRequest } from 'fastify';
import { permissionService } from '../application/permission.service';
import { authenticate, authorize } from '@shared/middleware/auth';

export async function permissionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', authorize('ROLE_READ'));

  app.get('/', async (_request: FastifyRequest) => {
    const result = await permissionService.findAll();
    return { success: true, data: result };
  });
}
