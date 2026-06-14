"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJsonReport = generateJsonReport;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const prisma_1 = require("@shared/database/prisma");
const logger_1 = require("@shared/utils/logger");
const minio_1 = require("@shared/storage/minio");
const logger = (0, logger_1.getLogger)();
async function generateJsonReport(title, scanId, imageId, parameters) {
    const prisma = (0, prisma_1.getPrisma)();
    const tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'fortifyci-'));
    const reportId = crypto_1.default.randomUUID();
    const scan = scanId
        ? await prisma.scan.findUnique({ where: { id: scanId } })
        : await prisma.scan.findFirst({ orderBy: { createdAt: 'desc' } });
    const effectiveScanId = scanId || scan?.id || null;
    const where = {};
    if (effectiveScanId)
        where['scanId'] = effectiveScanId;
    if (imageId)
        where['scan'] = { imageId };
    const vulnerabilities = await prisma.vulnerability.findMany({
        where: where,
        include: { scan: { select: { imageRef: true } } },
        orderBy: [{ severity: 'desc' }, { cvssScore: 'desc' }],
    });
    const severityCounts = {};
    for (const v of vulnerabilities) {
        severityCounts[v.severity] = (severityCounts[v.severity] || 0) + 1;
    }
    const reportData = {
        reportTitle: title,
        generatedAt: new Date().toISOString(),
        scanId: effectiveScanId,
        imageId,
        scanInfo: scan ? {
            status: scan.status,
            scanType: scan.scanType,
            imageRef: scan.imageRef,
            startedAt: scan.startedAt?.toISOString(),
            completedAt: scan.completedAt?.toISOString(),
        } : null,
        summary: {
            totalVulnerabilities: vulnerabilities.length,
            severityCounts,
        },
        vulnerabilities: vulnerabilities.map((v) => ({
            vulnerabilityId: v.vulnerabilityId,
            packageName: v.packageName,
            packageVersion: v.packageVersion,
            packageType: v.packageType,
            severity: v.severity,
            cvssScore: v.cvssScore,
            cvssVector: v.cvssVector,
            cweIds: Array.isArray(v.cweIds) ? v.cweIds : [],
            title: v.title,
            description: v.description,
            fixedVersion: v.fixedVersion,
            publishedDate: v.publishedDate?.toISOString(),
            exploitAvailable: v.exploitAvailable,
            epssScore: v.epssScore,
            imageRef: v.scan?.imageRef,
        })),
    };
    const content = JSON.stringify(reportData, null, 2);
    const tmpPath = path_1.default.join(tmpDir, `${reportId}.json`);
    fs_1.default.writeFileSync(tmpPath, content, 'utf8');
    try {
        await (0, minio_1.ensureBucket)();
        const objectName = `reports/${reportId}.json`;
        const buffer = fs_1.default.readFileSync(tmpPath);
        await (0, minio_1.uploadFile)(objectName, buffer, buffer.length, 'application/json');
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
        logger.info({ objectName, fileSize: buffer.length, vulnCount: vulnerabilities.length }, 'JSON report uploaded to MinIO');
        return { filePath: objectName, fileSize: buffer.length };
    }
    catch (err) {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
        throw err;
    }
}
//# sourceMappingURL=json.js.map