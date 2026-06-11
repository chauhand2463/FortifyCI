import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { blastRadiusService } from '../application/blast-radius.service';
import { authenticate, authorize } from '@shared/middleware/auth';
import { ValidationError } from '@shared/errors';

export async function blastRadiusRoutes(app: FastifyInstance): Promise<void> {
  app.get('/cve/:cveId', { preHandler: [authenticate, authorize('VULNERABILITY_READ')] }, async (request: FastifyRequest<{ Params: { cveId: string } }>, reply: FastifyReply) => {
    const { cveId } = request.params;
    if (!cveId) throw new ValidationError('CVE ID is required');
    const result = await blastRadiusService.findByCve(cveId);
    return { success: true, data: result };
  });

  app.get('/package/:packageName', { preHandler: [authenticate, authorize('VULNERABILITY_READ')] }, async (request: FastifyRequest<{ Params: { packageName: string } }>, reply: FastifyReply) => {
    const { packageName } = request.params;
    if (!packageName) throw new ValidationError('Package name is required');
    const result = await blastRadiusService.findByPackage(packageName);
    return { success: true, data: result };
  });

  app.post('/cve/:cveId/rescan', { preHandler: [authenticate, authorize('SCAN_CREATE')] }, async (request: FastifyRequest<{ Params: { cveId: string } }>, reply: FastifyReply) => {
    const { cveId } = request.params;
    if (!cveId) throw new ValidationError('CVE ID is required');
    const result = await blastRadiusService.bulkRescan(cveId, request.user!.userId);
    return { success: true, data: result };
  });
}
