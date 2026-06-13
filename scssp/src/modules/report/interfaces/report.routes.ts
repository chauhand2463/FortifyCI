import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { reportService } from '../application/report.service';
import { createReportSchema, reportQuerySchema } from '../domain/report.types';
import { authenticate, authorize } from '@shared/middleware/auth';
import { getMinioClient, ensureBucket } from '@shared/storage/minio';
import { getEnv } from '@shared/config/env';
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

    const env = getEnv();
    const client = getMinioClient();
    await ensureBucket();

    try {
      const extMap: Record<string, string> = { PDF: 'pdf', CSV: 'csv', JSON: 'json' };
      const mimeMap: Record<string, string> = { PDF: 'application/pdf', CSV: 'text/csv', JSON: 'application/json' };
      const ext = extMap[report.format] || 'bin';
      const filename = `${report.title}.${ext}`;

      const presignedUrl = await client.presignedGetObject(env.MINIO_BUCKET, report.filePath, 60 * 60);
      return reply.redirect(302, presignedUrl);
    } catch {
      return reply.code(404).send({ success: false, message: 'Report file not found in storage' });
    }
  });

  app.get('/:id/presigned-url', {
    preHandler: [authorize('REPORT_DOWNLOAD')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const report = await reportService.findById(id);

    if (!report.filePath) {
      return reply.code(404).send({ success: false, message: 'Report file not yet generated' });
    }

    const env = getEnv();
    const client = getMinioClient();
    await ensureBucket();

    try {
      const presignedUrl = await client.presignedGetObject(env.MINIO_BUCKET, report.filePath, 24 * 60 * 60);
      return { success: true, data: { url: presignedUrl, expiresIn: 86400 } };
    } catch {
      return reply.code(404).send({ success: false, message: 'Report file not found in storage' });
    }
  });

  app.delete('/:id', {
    preHandler: [authorize('REPORT_DELETE')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await reportService.delete(id, request.user!.userId);
    return reply.code(204).send();
  });
}
