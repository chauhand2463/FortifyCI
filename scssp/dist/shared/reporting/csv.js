"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCsvReport = generateCsvReport;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const prisma_1 = require("@shared/database/prisma");
const logger_1 = require("@shared/utils/logger");
const minio_1 = require("@shared/storage/minio");
const logger = (0, logger_1.getLogger)();
function escapeCsv(value) {
    if (value == null)
        return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}
async function generateCsvReport(title, scanId, imageId, parameters) {
    const prisma = (0, prisma_1.getPrisma)();
    const tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'fortifyci-'));
    const reportId = crypto_1.default.randomUUID();
    const rows = [];
    rows.push(`# FortifyCI Vulnerability Report - ${title}`);
    rows.push(`# Generated: ${new Date().toISOString()}`);
    rows.push('');
    const scan = scanId
        ? await prisma.scan.findUnique({
            where: { id: scanId },
            include: { image: true },
        })
        : await prisma.scan.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { image: true },
        });
    if (scan) {
        rows.push(`# Image: ${scan.imageRef}`);
        rows.push(`# Status: ${scan.status}`);
        rows.push(`# Scan Date: ${scan.completedAt?.toISOString() || 'N/A'}`);
        rows.push('');
    }
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
    const header = [
        'Vulnerability ID',
        'Package Name',
        'Package Version',
        'Package Type',
        'Severity',
        'CVSS Score',
        'CVSS Vector',
        'CWE IDs',
        'Title',
        'Description',
        'Fixed Version',
        'Published Date',
        'Exploit Available',
        'EPSS Score',
        'Image Reference',
    ];
    rows.push(header.join(','));
    for (const v of vulnerabilities) {
        rows.push([
            escapeCsv(v.vulnerabilityId),
            escapeCsv(v.packageName),
            escapeCsv(v.packageVersion),
            escapeCsv(v.packageType),
            escapeCsv(v.severity),
            escapeCsv(v.cvssScore),
            escapeCsv(v.cvssVector),
            escapeCsv(Array.isArray(v.cweIds) ? v.cweIds.join('; ') : ''),
            escapeCsv(v.title),
            escapeCsv(v.description),
            escapeCsv(v.fixedVersion),
            escapeCsv(v.publishedDate?.toISOString()),
            escapeCsv(v.exploitAvailable ? 'Yes' : 'No'),
            escapeCsv(v.epssScore),
            escapeCsv(v.scan?.imageRef),
        ].join(','));
    }
    rows.push('');
    rows.push(`# Total Vulnerabilities: ${vulnerabilities.length}`);
    const severityCounts = {};
    for (const v of vulnerabilities) {
        severityCounts[v.severity] = (severityCounts[v.severity] || 0) + 1;
    }
    for (const [sev, count] of Object.entries(severityCounts)) {
        rows.push(`# ${sev}: ${count}`);
    }
    const content = rows.join('\r\n');
    const tmpPath = path_1.default.join(tmpDir, `${reportId}.csv`);
    fs_1.default.writeFileSync(tmpPath, content, 'utf8');
    try {
        await (0, minio_1.ensureBucket)();
        const objectName = `reports/${reportId}.csv`;
        const buffer = fs_1.default.readFileSync(tmpPath);
        await (0, minio_1.uploadFile)(objectName, buffer, buffer.length, 'text/csv');
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
        logger.info({ objectName, fileSize: buffer.length, vulnCount: vulnerabilities.length }, 'CSV report uploaded to MinIO');
        return { filePath: objectName, fileSize: buffer.length };
    }
    catch (err) {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
        throw err;
    }
}
//# sourceMappingURL=csv.js.map