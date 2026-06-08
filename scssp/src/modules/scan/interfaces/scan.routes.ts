import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { scanService } from '../application/scan.service';
import { createScanSchema, scanQuerySchema } from '../domain/scan.types';
import { authenticate, authorize } from '@shared/middleware/auth';
import { ValidationError } from '@shared/errors';

export async function scanRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.post('/', {
    preHandler: [authorize('SCAN_CREATE')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createScanSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    const result = await scanService.create(parsed.data, request.user!.userId);
    return reply.code(201).send({ success: true, data: result });
  });

  app.get('/', {
    preHandler: [authorize('SCAN_READ')],
  }, async (request: FastifyRequest) => {
    const parsed = scanQuerySchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    const result = await scanService.findAll(parsed.data);
    return { success: true, ...result };
  });

  app.get('/:id', {
    preHandler: [authorize('SCAN_READ')],
  }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const result = await scanService.findById(id);
    return { success: true, data: result };
  });

  app.post('/:id/cancel', {
    preHandler: [authorize('SCAN_CANCEL')],
  }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    await scanService.cancelScan(id, request.user!.userId);
    return { success: true, message: 'Scan cancelled' };
  });
}
