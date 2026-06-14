"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postureService = exports.PostureService = void 0;
const prisma_1 = require("@shared/database/prisma");
class PostureService {
    async computeSnapshot(scanId) {
        const prisma = (0, prisma_1.getPrisma)();
        const scan = await prisma.scan.findUnique({ where: { id: scanId } });
        if (!scan || scan.status !== 'COMPLETED')
            return;
        const vulns = await prisma.vulnerability.findMany({ where: { scanId } });
        const criticalCount = vulns.filter((v) => v.severity === 'CRITICAL').length;
        const highCount = vulns.filter((v) => v.severity === 'HIGH').length;
        const mediumCount = vulns.filter((v) => v.severity === 'MEDIUM').length;
        const lowCount = vulns.filter((v) => v.severity === 'LOW' || v.severity === 'UNKNOWN').length;
        const fixableCount = vulns.filter((v) => v.fixedVersion).length;
        const penalty = (criticalCount * 40) + (highCount * 15) + (mediumCount * 5) + (lowCount * 1);
        const postureScore = Math.max(0, 100 - penalty);
        const suppressionCount = await this.countSuppressedForImage(scan.imageId, vulns);
        await prisma.postureSnapshot.upsert({
            where: { scanId },
            update: { criticalCount, highCount, mediumCount, lowCount, fixableCount, suppressedCount: suppressionCount, postureScore },
            create: { scanId, imageId: scan.imageId, criticalCount, highCount, mediumCount, lowCount, fixableCount, suppressedCount: suppressionCount, postureScore },
        });
    }
    async getOrgTrend(dateFrom, dateTo) {
        const prisma = (0, prisma_1.getPrisma)();
        const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const to = dateTo ? new Date(dateTo) : new Date();
        const snapshots = await prisma.postureSnapshot.findMany({
            where: { snapshotAt: { gte: from, lte: to } },
            orderBy: { snapshotAt: 'asc' },
        });
        const dailyMap = new Map();
        for (const s of snapshots) {
            const day = s.snapshotAt.toISOString().split('T')[0];
            const entry = dailyMap.get(day) || { score: 0, critical: 0, high: 0, medium: 0, low: 0, count: 0 };
            entry.score += s.postureScore;
            entry.critical += s.criticalCount;
            entry.high += s.highCount;
            entry.medium += s.mediumCount;
            entry.low += s.lowCount;
            entry.count++;
            dailyMap.set(day, entry);
        }
        return Array.from(dailyMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, data]) => ({
            date,
            score: Math.round((data.score / data.count) * 100) / 100,
            critical: Math.round(data.critical / data.count),
            high: Math.round(data.high / data.count),
            medium: Math.round(data.medium / data.count),
            low: Math.round(data.low / data.count),
        }));
    }
    async getImageHistory(imageId) {
        const prisma = (0, prisma_1.getPrisma)();
        const snapshots = await prisma.postureSnapshot.findMany({
            where: { imageId },
            include: { image: { select: { id: true, name: true, tag: true, registry: true, repository: true } } },
            orderBy: { snapshotAt: 'asc' },
        });
        return snapshots.map((s) => ({
            id: s.id,
            imageId: s.imageId,
            imageRef: `${s.image.registry}/${s.image.repository}:${s.image.tag}`,
            scanId: s.scanId,
            criticalCount: s.criticalCount,
            highCount: s.highCount,
            mediumCount: s.mediumCount,
            lowCount: s.lowCount,
            fixableCount: s.fixableCount,
            suppressedCount: s.suppressedCount,
            postureScore: s.postureScore,
            snapshotAt: s.snapshotAt.toISOString(),
        }));
    }
    async getLeaderboard() {
        const prisma = (0, prisma_1.getPrisma)();
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        const images = await prisma.image.findMany({ where: { deletedAt: null } });
        const entries = [];
        for (const image of images) {
            const recentSnapshots = await prisma.postureSnapshot.findMany({
                where: { imageId: image.id, snapshotAt: { gte: thirtyDaysAgo } },
            });
            if (recentSnapshots.length === 0)
                continue;
            const avgScore = Math.round((recentSnapshots.reduce((s, n) => s + n.postureScore, 0) / recentSnapshots.length) * 100) / 100;
            const olderSnapshots = await prisma.postureSnapshot.findMany({
                where: { imageId: image.id, snapshotAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
            });
            const olderAvg = olderSnapshots.length > 0
                ? olderSnapshots.reduce((s, n) => s + n.postureScore, 0) / olderSnapshots.length
                : avgScore;
            let trend;
            if (avgScore > olderAvg + 5)
                trend = 'improving';
            else if (avgScore < olderAvg - 5)
                trend = 'declining';
            else
                trend = 'stable';
            entries.push({
                imageId: image.id,
                imageRef: `${image.registry}/${image.repository}:${image.tag}`,
                averageScore: avgScore,
                scanCount: recentSnapshots.length,
                trend,
            });
        }
        entries.sort((a, b) => b.averageScore - a.averageScore);
        const sortedByImprovement = [...entries].sort((a, b) => {
            const aScore = a.trend === 'improving' ? 1 : a.trend === 'declining' ? -1 : 0;
            const bScore = b.trend === 'improving' ? 1 : b.trend === 'declining' ? -1 : 0;
            return bScore - aScore;
        });
        return {
            best: entries.slice(0, 10),
            worst: entries.slice(-10).reverse(),
            mostImproved: sortedByImprovement.slice(0, 10),
        };
    }
    async getWeeklyDigest() {
        const prisma = (0, prisma_1.getPrisma)();
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentSnapshots = await prisma.postureSnapshot.findMany({
            where: { snapshotAt: { gte: weekAgo } },
        });
        const orgScore = recentSnapshots.length > 0
            ? Math.round(recentSnapshots.reduce((s, n) => s + n.postureScore, 0) / recentSnapshots.length * 100) / 100
            : 100;
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const olderSnapshots = await prisma.postureSnapshot.findMany({
            where: { snapshotAt: { gte: twoWeeksAgo, lt: weekAgo } },
        });
        const olderScore = olderSnapshots.length > 0
            ? olderSnapshots.reduce((s, n) => s + n.postureScore, 0) / olderSnapshots.length
            : orgScore;
        const scoreTrend = orgScore > olderScore + 2 ? 'up' : orgScore < olderScore - 2 ? 'down' : 'stable';
        const recentDiffs = await prisma.scanDiff.findMany({
            where: { computedAt: { gte: weekAgo }, regressionDetected: true },
            include: { scan: { include: { image: true } } },
            take: 5,
            orderBy: { deltaScore: 'desc' },
        });
        const topRegressions = recentDiffs.map((d) => ({
            scanId: d.scanId,
            imageRef: `${d.scan.image.registry}/${d.scan.image.repository}:${d.scan.image.tag}`,
            deltaScore: d.deltaScore,
        }));
        const slaBreaches = await prisma.vulnerabilityAssignment.count({
            where: { slaBreached: true, updatedAt: { gte: weekAgo } },
        });
        return { orgScore, scoreTrend, topRegressions, slaBreaches };
    }
    async countSuppressedForImage(imageId, vulns) {
        const prisma = (0, prisma_1.getPrisma)();
        const activeExceptions = await prisma.vulnerabilityException.findMany({
            where: {
                isActive: true,
                expiresAt: { gt: new Date() },
                OR: [{ imageId }, { imageId: null }],
            },
        });
        const exceptedCves = new Set(activeExceptions.map((e) => e.cveId));
        return vulns.filter((v) => exceptedCves.has(v.vulnerabilityId)).length;
    }
}
exports.PostureService = PostureService;
exports.postureService = new PostureService();
//# sourceMappingURL=posture.service.js.map