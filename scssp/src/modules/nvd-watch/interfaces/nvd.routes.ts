import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { nvdService } from '../application/nvd.service';
import { authenticate, authorize } from '@shared/middleware/auth';

export async function nvdRoutes(app: FastifyInstance): Promise<void> {
  app.get('/status', { preHandler: [authenticate, authorize('AUDIT_LOG_READ')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await nvdService.getStatus();
    return { success: true, data: result };
  });

  app.get('/recent', { preHandler: [authenticate, authorize('VULNERABILITY_READ')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const result = await nvdService.getRecent({
      processed: query.processed !== undefined ? query.processed === 'true' : undefined,
      page: parseInt(query.page || '1'),
      limit: parseInt(query.limit || '20'),
    });
    return { success: true, data: result.items, total: result.total };
  });
}
