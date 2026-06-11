import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { postureService } from '../application/posture.service';
import { authenticate, authorize } from '@shared/middleware/auth';

export async function postureRoutes(app: FastifyInstance): Promise<void> {
  app.get('/org', { preHandler: [authenticate, authorize('VULNERABILITY_READ')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const result = await postureService.getOrgTrend(query.dateFrom, query.dateTo);
    return { success: true, data: result };
  });

  app.get('/image/:imageId', { preHandler: [authenticate, authorize('VULNERABILITY_READ')] }, async (request: FastifyRequest<{ Params: { imageId: string } }>, reply: FastifyReply) => {
    const result = await postureService.getImageHistory(request.params.imageId);
    return { success: true, data: result };
  });

  app.get('/leaderboard', { preHandler: [authenticate, authorize('VULNERABILITY_READ')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await postureService.getLeaderboard();
    return { success: true, data: result };
  });

  app.get('/weekly-digest', { preHandler: [authenticate, authorize('VULNERABILITY_READ')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await postureService.getWeeklyDigest();
    return { success: true, data: result };
  });
}
