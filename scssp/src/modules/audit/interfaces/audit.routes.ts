import { FastifyInstance, FastifyRequest } from 'fastify';
import { auditService } from '../application/audit.service';
import { authenticate, authorize } from '@shared/middleware/auth';

export async function auditRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/', {
    preHandler: [authorize('AUDIT_LOG_READ')],
  }, async (request: FastifyRequest) => {
    const query = request.query as {
      action?: string;
      entity?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
      page?: string;
      limit?: string;
    };

    const result = await auditService.search({
      action: query.action,
      entity: query.entity,
      userId: query.userId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit: Number(query.limit) || 50,
      offset: ((Number(query.page) || 1) - 1) * (Number(query.limit) || 50),
    });

    return { success: true, ...result };
  });

  app.get('/user/:userId', {
    preHandler: [authorize('AUDIT_LOG_READ')],
  }, async (request: FastifyRequest) => {
    const { userId } = request.params as { userId: string };
    const query = request.query as { page?: string; limit?: string };
    const limit = Number(query.limit) || 50;
    const offset = ((Number(query.page) || 1) - 1) * limit;
    const items = await auditService.findByUser(userId, limit, offset);
    return { success: true, data: items };
  });
}
