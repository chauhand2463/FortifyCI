"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveScanService = exports.LiveScanService = void 0;
const prisma_1 = require("@shared/database/prisma");
const queue_1 = require("@shared/queue");
const audit_service_1 = require("@modules/audit/application/audit.service");
const errors_1 = require("@shared/errors");
class LiveScanService {
    async create(dto, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const liveScan = await prisma.liveScan.create({
            data: {
                requestedById: userId,
                imageRef: dto.imageRef,
                policyId: dto.policyId || null,
                status: 'PENDING',
                progress: 0,
            },
        });
        const queue = (0, queue_1.getQueue)('scan');
        await queue.add('live-scan', {
            liveScanId: liveScan.id,
            imageRef: dto.imageRef,
            policyId: dto.policyId,
            registryCredentials: dto.registryCredentials,
            userId,
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
        });
        await audit_service_1.auditService.record({
            action: 'LIVE_SCAN_CREATED',
            entity: 'LiveScan',
            entityId: liveScan.id,
            description: `Live scan created for ${dto.imageRef}`,
            userId,
        });
        return this.mapResponse(liveScan);
    }
    async findById(id) {
        const prisma = (0, prisma_1.getPrisma)();
        const scan = await prisma.liveScan.findUnique({ where: { id } });
        if (!scan)
            throw new errors_1.NotFoundError('LiveScan', id);
        return this.mapResponse(scan);
    }
    async findByDigest(digest, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const cached = await prisma.liveScan.findFirst({
            where: {
                imageDigest: digest,
                status: 'PASSED',
                completedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
            orderBy: { completedAt: 'desc' },
        });
        if (!cached)
            return null;
        return this.mapResponse(cached);
    }
    async updateProgress(liveScanId, progress, status) {
        const prisma = (0, prisma_1.getPrisma)();
        const data = { progress };
        if (status)
            data.status = status;
        await prisma.liveScan.update({ where: { id: liveScanId }, data });
    }
    async complete(liveScanId, passed, blockingReason, downloadUrl) {
        const prisma = (0, prisma_1.getPrisma)();
        const data = {
            status: passed ? 'PASSED' : 'BLOCKED',
            progress: 100,
            passed,
            completedAt: new Date(),
        };
        if (blockingReason)
            data.blockingReason = blockingReason;
        if (downloadUrl) {
            data.downloadUrl = downloadUrl;
            data.downloadExpiry = new Date(Date.now() + 60 * 60 * 1000);
        }
        await prisma.liveScan.update({ where: { id: liveScanId }, data });
    }
    async fail(liveScanId, error) {
        const prisma = (0, prisma_1.getPrisma)();
        await prisma.liveScan.update({
            where: { id: liveScanId },
            data: { status: 'FAILED', blockingReason: error, completedAt: new Date() },
        });
    }
    mapResponse(s) {
        return {
            id: s.id,
            imageRef: s.imageRef,
            status: s.status,
            progress: s.progress,
            passed: s.passed,
            blockingReason: s.blockingReason,
            downloadUrl: s.downloadUrl,
            downloadExpiry: s.downloadExpiry?.toISOString() || null,
            createdAt: s.createdAt?.toISOString() || '',
            completedAt: s.completedAt?.toISOString() || null,
        };
    }
}
exports.LiveScanService = LiveScanService;
exports.liveScanService = new LiveScanService();
//# sourceMappingURL=live-scan.service.js.map