"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanService = exports.ScanService = void 0;
const prisma_1 = require("@shared/database/prisma");
const audit_service_1 = require("@modules/audit/application/audit.service");
const errors_1 = require("@shared/errors");
const queue_1 = require("@shared/queue");
const trivy_1 = require("@shared/scanner/trivy");
class ScanService {
    async create(dto, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const image = await prisma.image.findUnique({ where: { id: dto.imageId } });
        if (!image || image.deletedAt)
            throw new errors_1.NotFoundError('Image', dto.imageId);
        const scan = await prisma.scan.create({
            data: {
                imageId: dto.imageId,
                imageRef: `${image.registry}/${image.repository}:${image.tag}`,
                scanType: dto.scanType,
                maxRetries: dto.maxRetries,
                metadata: dto.metadata ? JSON.parse(JSON.stringify(dto.metadata)) : undefined,
                userId,
            },
        });
        const queue = (0, queue_1.getQueue)('scan');
        await queue.add('scan-image', { scanId: scan.id, imageId: dto.imageId }, {
            attempts: dto.maxRetries + 1,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 100,
            removeOnFail: 100,
        });
        await prisma.scan.update({
            where: { id: scan.id },
            data: { status: 'QUEUED' },
        });
        await audit_service_1.auditService.record({
            action: 'SCAN_CREATED',
            entity: 'Scan',
            entityId: scan.id,
            description: `Scan created for image: ${image.registry}/${image.repository}:${image.tag}`,
            metadata: { scanType: dto.scanType },
            userId,
        });
        return this.mapScanResponse(await prisma.scan.findUnique({
            where: { id: scan.id },
            include: { image: true, vulnerabilities: true },
        }));
    }
    async findAll(query) {
        const prisma = (0, prisma_1.getPrisma)();
        const { page, limit, status, imageId, sortBy, sortOrder } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (imageId)
            where.imageId = imageId;
        const [items, total] = await Promise.all([
            prisma.scan.findMany({
                where,
                include: {
                    image: { select: { id: true, name: true, tag: true, registry: true, repository: true } },
                    vulnerabilities: true,
                    diff: true,
                },
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.scan.count({ where }),
        ]);
        return {
            items: items.map((s) => this.mapScanResponse(s)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findById(id) {
        const prisma = (0, prisma_1.getPrisma)();
        const scan = await prisma.scan.findUnique({
            where: { id },
            include: {
                image: { select: { id: true, name: true, tag: true, registry: true, repository: true } },
                vulnerabilities: true,
                diff: true,
            },
        });
        if (!scan)
            throw new errors_1.NotFoundError('Scan', id);
        return this.mapScanResponse(scan);
    }
    async cancelScan(id, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const scan = await prisma.scan.findUnique({ where: { id } });
        if (!scan)
            throw new errors_1.NotFoundError('Scan', id);
        if (!['PENDING', 'QUEUED', 'RUNNING'].includes(scan.status)) {
            throw new errors_1.ValidationError('Scan cannot be cancelled in its current state');
        }
        await prisma.scan.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
        const killed = (0, trivy_1.cancelScanProcess)(id);
        const queue = (0, queue_1.getQueue)('scan');
        const jobs = await queue.getJobs(['active', 'waiting', 'delayed']);
        for (const job of jobs) {
            if (job.data.scanId === id) {
                await job.remove();
            }
        }
        await audit_service_1.auditService.record({
            action: 'SCAN_CANCELLED',
            entity: 'Scan',
            entityId: id,
            description: `Scan cancelled: ${scan.imageRef}${killed ? ' (process terminated)' : ''}`,
            userId,
        });
    }
    async getSbom(scanId) {
        const prisma = (0, prisma_1.getPrisma)();
        const sbom = await prisma.sBOM.findFirst({
            where: { scanId },
            orderBy: { createdAt: 'desc' },
        });
        if (!sbom)
            throw new errors_1.NotFoundError('SBOM', scanId);
        return sbom;
    }
    async getPackages(scanId) {
        const prisma = (0, prisma_1.getPrisma)();
        return prisma.package.findMany({ where: { scanId } });
    }
    async downloadSbom(scanId, format) {
        const prisma = (0, prisma_1.getPrisma)();
        const sbom = await prisma.sBOM.findFirst({
            where: { scanId },
            orderBy: { createdAt: 'desc' },
        });
        if (!sbom)
            throw new errors_1.NotFoundError('SBOM', scanId);
        const sbomFormat = format?.toUpperCase() || sbom.format;
        const raw = sbom.rawDocument || sbom.content;
        return {
            content: JSON.stringify(raw, null, 2),
            contentType: 'application/json',
            filename: `sbom-${scanId}-${sbomFormat.toLowerCase()}.json`,
        };
    }
    mapScanResponse(scan) {
        const vulns = scan.vulnerabilities ?? [];
        const criticalCount = vulns.filter((v) => v.severity === 'CRITICAL').length;
        const highCount = vulns.filter((v) => v.severity === 'HIGH').length;
        const mediumCount = vulns.filter((v) => v.severity === 'MEDIUM').length;
        const lowCount = vulns.filter((v) => v.severity === 'LOW' || v.severity === 'UNKNOWN').length;
        const regressionDetected = scan.diff?.regressionDetected || false;
        return {
            id: scan.id,
            imageId: scan.imageId,
            imageName: `${scan.image.registry}/${scan.image.repository}:${scan.image.tag}`,
            scanType: scan.scanType,
            status: scan.status,
            progress: scan.progress,
            errorMessage: scan.errorMessage,
            startedAt: scan.startedAt,
            completedAt: scan.completedAt,
            retryCount: scan.retryCount,
            maxRetries: scan.maxRetries,
            triggeredBy: scan.triggeredBy,
            metadata: scan.metadata,
            vulnerabilitiesCount: vulns.length,
            criticalCount,
            highCount,
            mediumCount,
            lowCount,
            regressionDetected,
            createdAt: scan.createdAt,
            updatedAt: scan.updatedAt,
        };
    }
}
exports.ScanService = ScanService;
exports.scanService = new ScanService();
//# sourceMappingURL=scan.service.js.map