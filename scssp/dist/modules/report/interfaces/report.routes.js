"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRoutes = reportRoutes;
const report_service_1 = require("../application/report.service");
const report_types_1 = require("../domain/report.types");
const auth_1 = require("@shared/middleware/auth");
const minio_1 = require("@shared/storage/minio");
const env_1 = require("@shared/config/env");
const errors_1 = require("@shared/errors");
async function reportRoutes(app) {
    app.addHook('preHandler', auth_1.authenticate);
    app.post('/', {
        preHandler: [(0, auth_1.authorize)('REPORT_CREATE')],
    }, async (request, reply) => {
        const parsed = report_types_1.createReportSchema.safeParse(request.body);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await report_service_1.reportService.create(parsed.data, request.user.userId);
        return reply.code(201).send({ success: true, data: result });
    });
    app.get('/', {
        preHandler: [(0, auth_1.authorize)('REPORT_READ')],
    }, async (request) => {
        const parsed = report_types_1.reportQuerySchema.safeParse(request.query);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await report_service_1.reportService.findAll(parsed.data);
        return { success: true, ...result };
    });
    app.get('/:id', {
        preHandler: [(0, auth_1.authorize)('REPORT_READ')],
    }, async (request) => {
        const { id } = request.params;
        const result = await report_service_1.reportService.findById(id);
        return { success: true, data: result };
    });
    app.get('/:id/download', {
        preHandler: [(0, auth_1.authorize)('REPORT_DOWNLOAD')],
    }, async (request, reply) => {
        const { id } = request.params;
        const report = await report_service_1.reportService.findById(id);
        if (!report.filePath) {
            return reply.code(404).send({ success: false, message: 'Report file not yet generated' });
        }
        const env = (0, env_1.getEnv)();
        const client = (0, minio_1.getMinioClient)();
        await (0, minio_1.ensureBucket)();
        try {
            const extMap = { PDF: 'pdf', CSV: 'csv', JSON: 'json' };
            const mimeMap = { PDF: 'application/pdf', CSV: 'text/csv', JSON: 'application/json' };
            const ext = extMap[report.format] || 'bin';
            const filename = `${report.title}.${ext}`;
            const presignedUrl = await client.presignedGetObject(env.MINIO_BUCKET, report.filePath, 60 * 60);
            return reply.redirect(302, presignedUrl);
        }
        catch {
            return reply.code(404).send({ success: false, message: 'Report file not found in storage' });
        }
    });
    app.get('/:id/presigned-url', {
        preHandler: [(0, auth_1.authorize)('REPORT_DOWNLOAD')],
    }, async (request, reply) => {
        const { id } = request.params;
        const report = await report_service_1.reportService.findById(id);
        if (!report.filePath) {
            return reply.code(404).send({ success: false, message: 'Report file not yet generated' });
        }
        const env = (0, env_1.getEnv)();
        const client = (0, minio_1.getMinioClient)();
        await (0, minio_1.ensureBucket)();
        try {
            const presignedUrl = await client.presignedGetObject(env.MINIO_BUCKET, report.filePath, 24 * 60 * 60);
            return { success: true, data: { url: presignedUrl, expiresIn: 86400 } };
        }
        catch {
            return reply.code(404).send({ success: false, message: 'Report file not found in storage' });
        }
    });
    app.delete('/:id', {
        preHandler: [(0, auth_1.authorize)('REPORT_DELETE')],
    }, async (request, reply) => {
        const { id } = request.params;
        await report_service_1.reportService.delete(id, request.user.userId);
        return reply.code(204).send();
    });
}
//# sourceMappingURL=report.routes.js.map