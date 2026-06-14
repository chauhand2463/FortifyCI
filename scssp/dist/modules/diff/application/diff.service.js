"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffService = exports.DiffService = void 0;
const prisma_1 = require("@shared/database/prisma");
const errors_1 = require("@shared/errors");
class DiffService {
    async getDiffForScan(scanId) {
        const prisma = (0, prisma_1.getPrisma)();
        const scanDiff = await prisma.scanDiff.findUnique({
            where: { scanId },
        });
        if (!scanDiff)
            throw new errors_1.NotFoundError('ScanDiff', scanId);
        return this.buildDiffResponse(scanDiff);
    }
    async getManualDiff(scanAId, scanBId) {
        const prisma = (0, prisma_1.getPrisma)();
        const [scanA, scanB] = await Promise.all([
            prisma.scan.findUnique({ where: { id: scanAId } }),
            prisma.scan.findUnique({ where: { id: scanBId } }),
        ]);
        if (!scanA)
            throw new errors_1.NotFoundError('Scan', scanAId);
        if (!scanB)
            throw new errors_1.NotFoundError('Scan', scanBId);
        if (scanA.status !== 'COMPLETED' || scanB.status !== 'COMPLETED') {
            throw new errors_1.ValidationError('Both scans must be completed');
        }
        const [vulnsA, vulnsB] = await Promise.all([
            prisma.vulnerability.findMany({ where: { scanId: scanAId } }),
            prisma.vulnerability.findMany({ where: { scanId: scanBId } }),
        ]);
        const cveIdsA = new Set(vulnsA.map((v) => v.vulnerabilityId));
        const cveIdsB = new Set(vulnsB.map((v) => v.vulnerabilityId));
        const introduced = vulnsB.filter((v) => !cveIdsA.has(v.vulnerabilityId));
        const resolved = vulnsA.filter((v) => !cveIdsB.has(v.vulnerabilityId));
        const persisted = vulnsB.filter((v) => cveIdsA.has(v.vulnerabilityId));
        const severityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, UNKNOWN: 0 };
        const introductionScore = introduced.reduce((sum, v) => sum + (severityWeight[v.severity] || 0), 0);
        const resolutionScore = resolved.reduce((sum, v) => sum + (severityWeight[v.severity] || 0), 0);
        const deltaScore = introductionScore - resolutionScore;
        const regressionDetected = introduced.some((v) => v.severity === 'CRITICAL' || v.severity === 'HIGH');
        const mapVuln = (v) => ({
            id: v.id,
            vulnerabilityId: v.vulnerabilityId,
            severity: v.severity,
            packageName: v.packageName,
            pkgName: v.pkgName,
            fixedVersion: v.fixedVersion,
            title: v.title,
        });
        return {
            scanId: scanBId,
            baselineScanId: scanAId,
            summary: {
                introduced: introduced.length,
                resolved: resolved.length,
                persisted: persisted.length,
                deltaScore,
                regressionDetected,
            },
            introduced: introduced.map(mapVuln),
            resolved: resolved.map(mapVuln),
            persisted: persisted.map(mapVuln),
        };
    }
    async computeAndStoreDiff(scanId) {
        const prisma = (0, prisma_1.getPrisma)();
        const scan = await prisma.scan.findUnique({ where: { id: scanId } });
        if (!scan || scan.status !== 'COMPLETED')
            return;
        const priorScan = await prisma.scan.findFirst({
            where: {
                imageId: scan.imageId,
                id: { not: scanId },
                status: 'COMPLETED',
            },
            orderBy: { completedAt: 'desc' },
        });
        if (!priorScan)
            return;
        const [currentVulns, priorVulns] = await Promise.all([
            prisma.vulnerability.findMany({ where: { scanId } }),
            prisma.vulnerability.findMany({ where: { scanId: priorScan.id } }),
        ]);
        const priorCveIds = new Set(priorVulns.map((v) => v.vulnerabilityId));
        const currentCveIds = new Set(currentVulns.map((v) => v.vulnerabilityId));
        const introduced = currentVulns.filter((v) => !priorCveIds.has(v.vulnerabilityId));
        const resolved = priorVulns.filter((v) => !currentCveIds.has(v.vulnerabilityId));
        const persisted = currentVulns.filter((v) => priorCveIds.has(v.vulnerabilityId));
        const severityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, UNKNOWN: 0 };
        const introductionScore = introduced.reduce((sum, v) => sum + (severityWeight[v.severity] || 0), 0);
        const resolutionScore = resolved.reduce((sum, v) => sum + (severityWeight[v.severity] || 0), 0);
        const deltaScore = introductionScore - resolutionScore;
        const regressionDetected = introduced.some((v) => v.severity === 'CRITICAL' || v.severity === 'HIGH');
        await prisma.scanDiff.upsert({
            where: { scanId },
            update: {
                baselineScanId: priorScan.id,
                introducedCount: introduced.length,
                resolvedCount: resolved.length,
                persistedCount: persisted.length,
                deltaScore,
                regressionDetected,
                introducedCveIds: introduced.map((v) => v.vulnerabilityId),
                resolvedCveIds: resolved.map((v) => v.vulnerabilityId),
            },
            create: {
                scanId,
                baselineScanId: priorScan.id,
                introducedCount: introduced.length,
                resolvedCount: resolved.length,
                persistedCount: persisted.length,
                deltaScore,
                regressionDetected,
                introducedCveIds: introduced.map((v) => v.vulnerabilityId),
                resolvedCveIds: resolved.map((v) => v.vulnerabilityId),
            },
        });
    }
    async buildDiffResponse(scanDiff) {
        const prisma = (0, prisma_1.getPrisma)();
        const introduced = await prisma.vulnerability.findMany({
            where: { vulnerabilityId: { in: scanDiff.introducedCveIds }, scanId: scanDiff.scanId },
        });
        const resolved = await prisma.vulnerability.findMany({
            where: { vulnerabilityId: { in: scanDiff.resolvedCveIds }, scanId: scanDiff.baselineScanId },
        });
        const persistedVulns = await prisma.vulnerability.findMany({
            where: { scanId: scanDiff.scanId, vulnerabilityId: { notIn: scanDiff.introducedCveIds } },
            take: 100,
        });
        const mapVuln = (v) => ({
            id: v.id,
            vulnerabilityId: v.vulnerabilityId,
            severity: v.severity,
            packageName: v.packageName,
            pkgName: v.pkgName,
            fixedVersion: v.fixedVersion,
            title: v.title,
        });
        return {
            scanId: scanDiff.scanId,
            baselineScanId: scanDiff.baselineScanId,
            summary: {
                introduced: scanDiff.introducedCount,
                resolved: scanDiff.resolvedCount,
                persisted: scanDiff.persistedCount,
                deltaScore: scanDiff.deltaScore,
                regressionDetected: scanDiff.regressionDetected,
            },
            introduced: introduced.map(mapVuln),
            resolved: resolved.map(mapVuln),
            persisted: persistedVulns.map(mapVuln),
        };
    }
}
exports.DiffService = DiffService;
exports.diffService = new DiffService();
//# sourceMappingURL=diff.service.js.map