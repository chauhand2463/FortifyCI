import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { liveScanService } from '../application/live-scan.service';
import { authenticate, authorize } from '@shared/middleware/auth';
import { ValidationError } from '@shared/errors';

export async function liveScanRoutes(app: FastifyInstance): Promise<void> {
  app.post('/', { preHandler: [authenticate, authorize('LIVE_SCAN_CREATE')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    if (!body.imageRef) throw new ValidationError('imageRef required');
    const result = await liveScanService.create(body, request.user!.userId);
    return reply.code(202).send({ success: true, data: result });
  });

  app.get('/:id', { preHandler: [authenticate, authorize('LIVE_SCAN_CREATE')] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const result = await liveScanService.findById(request.params.id);
    return { success: true, data: result };
  });

  app.get('/:id/events', { preHandler: [authenticate, authorize('LIVE_SCAN_CREATE')] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const scan = await liveScanService.findById(request.params.id);
    if (!scan) throw new ValidationError('Live scan not found');

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const interval = setInterval(async () => {
      try {
        const current = await liveScanService.findById(request.params.id);
        reply.raw.write(`data: ${JSON.stringify({ status: current.status, progress: current.progress })}\n\n`);
        if (current.status === 'PASSED' || current.status === 'BLOCKED' || current.status === 'FAILED') {
          clearInterval(interval);
          reply.raw.end();
        }
      } catch {
        clearInterval(interval);
        reply.raw.end();
      }
    }, 2000);

    request.raw.on('close', () => {
      clearInterval(interval);
    });
  });
}
