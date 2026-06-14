"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blastRadiusService = exports.BlastRadiusService = void 0;
const prisma_1 = require("@shared/database/prisma");
const audit_service_1 = require("@modules/audit/application/audit.service");
const queue_1 = require("@shared/queue");
class BlastRadiusService {
    async findByCve(cveId) {
        const prisma = (0, prisma_1.getPrisma)();
        const vulns = await prisma.vulnerability.findMany({
            where: { vulnerabilityId: cveId },
            include: {
                scan: {
                    include: { image: true },
                },
            },
        });
        const completedVulns = vulns.filter((v) => v.scan?.status === 'COMPLETED' && !v.scan.image.deletedAt);
        const imageMap = new Map();
        for (const v of completedVulns) {
            const scan = v.scan;
            const image = scan.image;
            const key = image.id;
            if (!imageMap.has(key)) {
                imageMap.set(key, {
                    imageId: image.id,
                    imageRef: `${image.registry}/${image.repository}:${image.tag}`,
                    severity: v.severity,
                    pkgName: v.pkgName || v.packageName,
                    installedVersion: v.pkgVersion || v.packageVersion,
                    fixedVersion: v.fixedVersion,
                    lastScanId: scan.id,
                    lastScannedAt: scan.completedAt?.toISOString() || '',
                    isStale: scan.completedAt ? (Date.now() - scan.completedAt.getTime()) > 7 * 24 * 60 * 60 * 1000 : true,
                });
            }
        }
        const affectedImages = Array.from(imageMap.values());
        const fleetSize = await prisma.image.count({ where: { deletedAt: null } });
        const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
        let fixableImages = 0;
        for (const img of affectedImages) {
            const key = img.severity.toLowerCase();
            if (key in breakdown)
                breakdown[key]++;
            if (img.fixedVersion)
                fixableImages++;
        }
        return {
            cveId,
            totalAffected: affectedImages.length,
            fleetSize,
            fleetPercentage: fleetSize ? parseFloat(((affectedImages.length / fleetSize) * 100).toFixed(1)) : 0,
            breakdown,
            fixableImages,
            affectedImages,
        };
    }
    async findByPackage(packageName) {
        const prisma = (0, prisma_1.getPrisma)();
        const vulns = await prisma.vulnerability.findMany({
            where: {
                OR: [
                    { pkgName: { contains: packageName, mode: 'insensitive' } },
                    { packageName: { contains: packageName, mode: 'insensitive' } },
                ],
            },
            include: {
                scan: {
                    include: { image: true },
                },
            },
            take: 1000,
        });
        const completedVulns = vulns.filter((v) => v.scan?.status === 'COMPLETED' && !v.scan.image.deletedAt);
        const imageMap = new Map();
        for (const v of completedVulns) {
            const scan = v.scan;
            const image = scan.image;
            const key = image.id;
            if (!imageMap.has(key)) {
                imageMap.set(key, {
                    imageId: image.id,
                    imageRef: `${image.registry}/${image.repository}:${image.tag}`,
                    severity: v.severity,
                    pkgName: v.pkgName || v.packageName,
                    installedVersion: v.pkgVersion || v.packageVersion,
                    fixedVersion: v.fixedVersion,
                    lastScanId: scan.id,
                    lastScannedAt: scan.completedAt?.toISOString() || '',
                    isStale: scan.completedAt ? (Date.now() - scan.completedAt.getTime()) > 7 * 24 * 60 * 60 * 1000 : true,
                });
            }
        }
        const affectedImages = Array.from(imageMap.values());
        const fleetSize = await prisma.image.count({ where: { deletedAt: null } });
        const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
        let fixableImages = 0;
        for (const img of affectedImages) {
            const key = img.severity.toLowerCase();
            if (key in breakdown)
                breakdown[key]++;
            if (img.fixedVersion)
                fixableImages++;
        }
        return {
            cveId: packageName,
            totalAffected: affectedImages.length,
            fleetSize,
            fleetPercentage: fleetSize ? parseFloat(((affectedImages.length / fleetSize) * 100).toFixed(1)) : 0,
            breakdown,
            fixableImages,
            affectedImages,
        };
    }
    async bulkRescan(cveId, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const queue = (0, queue_1.getQueue)('scan');
        const vulns = await prisma.vulnerability.findMany({
            where: { vulnerabilityId: cveId },
            include: {
                scan: { include: { image: true } },
            },
        });
        const completedVulns = vulns.filter((v) => v.scan?.status === 'COMPLETED' && !v.scan.image.deletedAt);
        const imageIds = [...new Set(completedVulns.map((v) => v.scan.imageId))];
        let scansCreated = 0;
        for (const imageId of imageIds) {
            const image = await prisma.image.findUnique({ where: { id: imageId } });
            if (!image)
                continue;
            const scan = await prisma.scan.create({
                data: {
                    imageId: image.id,
                    imageRef: `${image.registry}/${image.repository}:${image.tag}`,
                    scanType: 'trivy',
                    triggeredBy: 'BLAST_RADIUS_RESCAN',
                    userId,
                },
            });
            await queue.add('scan-image', { scanId: scan.id, imageId: image.id }, {
                attempts: 4,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: 100,
                removeOnFail: 100,
            });
            await prisma.scan.update({
                where: { id: scan.id },
                data: { status: 'QUEUED' },
            });
            scansCreated++;
        }
        await audit_service_1.auditService.record({
            action: 'BLAST_RADIUS_RESCAN',
            entity: 'Scan',
            entityId: cveId,
            description: `Bulk rescan triggered for CVE ${cveId}: ${scansCreated} images queued`,
            userId,
        });
        return { scansCreated };
    }
}
exports.BlastRadiusService = BlastRadiusService;
exports.blastRadiusService = new BlastRadiusService();
//# sourceMappingURL=blast-radius.service.js.map