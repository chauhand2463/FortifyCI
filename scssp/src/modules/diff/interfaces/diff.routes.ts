import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { diffService } from '../application/diff.service';
import { authenticate, authorize } from '@shared/middleware/auth';
import { ValidationError } from '@shared/errors';

export async function diffRoutes(app: FastifyInstance): Promise<void> {
  app.get('/:id/diff', { preHandler: [authenticate, authorize('SCAN_READ')] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const result = await diffService.getDiffForScan(request.params.id);
    return { success: true, data: result };
  });

  app.get('/diff', { preHandler: [authenticate, authorize('SCAN_READ')] }, async (request: FastifyRequest<{ Querystring: { scanA: string; scanB: string } }>, reply: FastifyReply) => {
    const { scanA, scanB } = request.query;
    if (!scanA || !scanB) throw new ValidationError('Both scanA and scanB query params required');
    const result = await diffService.getManualDiff(scanA, scanB);
    return { success: true, data: result };
  });
}
