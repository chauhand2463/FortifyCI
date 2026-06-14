"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = exports.ReportService = void 0;
const prisma_1 = require("@shared/database/prisma");
const audit_service_1 = require("@modules/audit/application/audit.service");
const errors_1 = require("@shared/errors");
const queue_1 = require("@shared/queue");
const minio_1 = require("@shared/storage/minio");
const env_1 = require("@shared/config/env");
class ReportService {
    async create(dto, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const report = await prisma.report.create({
            data: {
                title: dto.title,
                format: dto.format,
                parameters: dto.parameters ? JSON.parse(JSON.stringify(dto.parameters)) : undefined,
                scanId: dto.scanId,
                imageId: dto.imageId,
                userId,
            },
        });
        const queue = (0, queue_1.getQueue)('report');
        await queue.add('generate-report', { reportId: report.id, format: dto.format }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
        });
        await audit_service_1.auditService.record({
            action: 'REPORT_CREATED',
            entity: 'Report',
            entityId: report.id,
            description: `Report queued: ${dto.title} (${dto.format})`,
            userId,
        });
        return this.mapReportResponse(report);
    }
    async findAll(query) {
        const prisma = (0, prisma_1.getPrisma)();
        const { page, limit, format, status } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (format)
            where.format = format;
        if (status)
            where.status = status;
        const [items, total] = await Promise.all([
            prisma.report.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.report.count({ where }),
        ]);
        return {
            items: items.map((r) => this.mapReportResponse(r)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findById(id) {
        const prisma = (0, prisma_1.getPrisma)();
        const report = await prisma.report.findUnique({ where: { id } });
        if (!report)
            throw new errors_1.NotFoundError('Report', id);
        return this.mapReportResponse(report);
    }
    async delete(id, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const report = await prisma.report.findUnique({ where: { id } });
        if (!report)
            throw new errors_1.NotFoundError('Report', id);
        if (report.filePath) {
            try {
                const env = (0, env_1.getEnv)();
                const client = (0, minio_1.getMinioClient)();
                await client.removeObject(env.MINIO_BUCKET, report.filePath);
            }
            catch { }
        }
        await prisma.report.delete({ where: { id } });
        await audit_service_1.auditService.record({
            action: 'REPORT_DELETED',
            entity: 'Report',
            entityId: id,
            description: `Report deleted: ${report.title}`,
            userId,
        });
    }
    mapReportResponse(report) {
        return {
            id: report.id,
            title: report.title,
            format: report.format,
            status: report.status,
            parameters: report.parameters,
            filePath: report.filePath,
            fileSize: report.fileSize,
            generatedAt: report.generatedAt,
            scanId: report.scanId,
            imageId: report.imageId,
            userId: report.userId,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
        };
    }
}
exports.ReportService = ReportService;
exports.reportService = new ReportService();
//# sourceMappingURL=report.service.js.map