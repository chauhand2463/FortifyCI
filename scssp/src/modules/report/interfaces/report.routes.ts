import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { reportService } from '../application/report.service';
import { createReportSchema, reportQuerySchema } from '../domain/report.types';
import { authenticate, authorize } from '@shared/middleware/auth';
import { ValidationError } from '@shared/errors';

export async function reportRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.post('/', {
    preHandler: [authorize('REPORT_CREATE')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createReportSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    const result = await reportService.create(parsed.data, request.user!.userId);
    return reply.code(201).send({ success: true, data: result });
  });

  app.get('/', {
    preHandler: [authorize('REPORT_READ')],
  }, async (request: FastifyRequest) => {
    const parsed = reportQuerySchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));

    const result = await reportService.findAll(parsed.data);
    return { success: true, ...result };
  });

  app.get('/:id', {
    preHandler: [authorize('REPORT_READ')],
  }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const result = await reportService.findById(id);
    return { success: true, data: result };
  });

  app.get('/:id/download', {
    preHandler: [authorize('REPORT_DOWNLOAD')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const report = await reportService.findById(id);

    if (!report.filePath) {
      return reply.code(404).send({ success: false, message: 'Report file not yet generated' });
    }

    const fs = await import('fs');
    const stream = fs.createReadStream(report.filePath);
    const ext = report.format === 'PDF' ? 'pdf' : 'csv';
    reply.header('Content-Type', report.format === 'PDF' ? 'application/pdf' : 'text/csv');
    reply.header('Content-Disposition', `attachment; filename="${report.title}.${ext}"`);
    return reply.send(stream);
  });

  app.delete('/:id', {
    preHandler: [authorize('REPORT_DOWNLOAD')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await reportService.delete(id, request.user!.userId);
    return reply.code(204).send();
  });
}
