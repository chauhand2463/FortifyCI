"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelScan = cancelScan;
exports.startWorkers = startWorkers;
const queue_1 = require("@shared/queue");
const prisma_1 = require("@shared/database/prisma");
const logger_1 = require("@shared/utils/logger");
const audit_service_1 = require("@modules/audit/application/audit.service");
const trivy_1 = require("@shared/scanner/trivy");
const generator_1 = require("@shared/sbom/generator");
const pdf_1 = require("@shared/reporting/pdf");
const csv_1 = require("@shared/reporting/csv");
const json_1 = require("@shared/reporting/json");
const email_1 = require("@shared/notifications/email");
const diff_service_1 = require("@modules/diff/application/diff.service");
const posture_service_1 = require("@modules/posture/application/posture.service");
const webhook_service_1 = require("@modules/webhook/application/webhook.service");
const assignment_service_1 = require("@modules/assignment/application/assignment.service");
const logger = (0, logger_1.getLogger)();
async function cancelScan(scanId) {
    const prisma = (0, prisma_1.getPrisma)();
    const queue = (0, queue_1.getQueue)('scan');
    const killed = (0, trivy_1.cancelScanProcess)(scanId);
    if (!killed) {
        const jobs = await queue.getJobs(['active', 'waiting', 'delayed']);
        for (const job of jobs) {
            if (job.data.scanId === scanId) {
                await job.remove();
                return true;
            }
        }
    }
    return killed;
}
async function extractAndStorePackages(scanId, sbomJson) {
    const prisma = (0, prisma_1.getPrisma)();
    const extracted = (0, generator_1.extractPackagesFromSbom)(sbomJson);
    if (extracted.length > 0) {
        await prisma.package.createMany({
            data: extracted.map((p) => ({ name: p.name, version: p.version, ecosystem: p.ecosystem, purl: p.purl ?? null, scanId })),
            skipDuplicates: true,
        });
        logger.info({ scanId, packageCount: extracted.length }, 'Packages extracted from SBOM');
    }
}
async function processScanJob(job) {
    const { scanId, imageId } = job.data;
    logger.info({ scanId, imageId }, 'Processing scan job');
    const prisma = (0, prisma_1.getPrisma)();
    try {
        const image = await prisma.image.findUnique({ where: { id: imageId } });
        if (!image)
            throw new Error('Image not found');
        await prisma.scan.update({
            where: { id: scanId },
            data: { status: 'RUNNING', startedAt: new Date(), progress: 10, jobId: job.id },
        });
        const imageRef = `${image.registry}/${image.repository}:${image.tag}`;
        logger.info({ imageRef, hasCredentials: !!image.registryCredentials }, 'Starting Trivy SBOM generation');
        await prisma.scan.update({ where: { id: scanId }, data: { progress: 15 } });
        const credentials = image.registryCredentials;
        const sbomProgress = setInterval(async () => {
            try {
                const cur = await prisma.scan.findUnique({ where: { id: scanId }, select: { progress: true } });
                const next = Math.min((cur?.progress ?? 15) + 2, 38);
                await prisma.scan.update({ where: { id: scanId }, data: { progress: next } });
            }
            catch { }
        }, 10000);
        let sbomJson;
        try {
            const sbomResult = await (0, generator_1.generateTrivySbom)(imageRef, 'cyclonedx', credentials);
            sbomJson = JSON.parse(sbomResult);
        }
        finally {
            clearInterval(sbomProgress);
        }
        await prisma.scan.update({ where: { id: scanId }, data: { progress: 40 } });
        const sbomRecord = await prisma.sBOM.create({
            data: {
                imageId: image.id,
                scanId,
                userId: image.userId,
                format: 'CYCLONEDX',
                version: '1.0',
                specVersion: '1.5',
                content: sbomJson,
                rawDocument: sbomJson,
                packageCount: 0,
            },
        });
        await extractAndStorePackages(scanId, sbomJson);
        await prisma.scan.update({ where: { id: scanId }, data: { progress: 50 } });
        logger.info({ imageRef }, 'Starting Trivy vulnerability scan');
        await prisma.scan.update({ where: { id: scanId }, data: { progress: 55 } });
        const scanProgress = setInterval(async () => {
            try {
                const cur = await prisma.scan.findUnique({ where: { id: scanId }, select: { progress: true } });
                const next = Math.min((cur?.progress ?? 55) + 2, 78);
                await prisma.scan.update({ where: { id: scanId }, data: { progress: next } });
            }
            catch { }
        }, 15000);
        let result;
        try {
            result = await (0, trivy_1.scanImage)(imageRef, credentials, scanId);
        }
        finally {
            clearInterval(scanProgress);
        }
        await prisma.scan.update({ where: { id: scanId }, data: { progress: 80 } });
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, UNKNOWN: 4 };
        for (const v of result.vulnerabilities) {
            await prisma.vulnerability.create({
                data: {
                    scanId,
                    vulnerabilityId: v.vulnerabilityId,
                    packageName: v.pkgName,
                    packageVersion: v.installedVersion,
                    packageType: v.pkgType,
                    severity: v.severity,
                    cvssScore: v.cvssScore,
                    cvssVector: v.cvssVector,
                    cweIds: v.cweIds,
                    title: v.title,
                    description: v.description,
                    fixedVersion: v.fixedVersion,
                    publishedDate: v.publishedDate ? new Date(v.publishedDate) : null,
                    lastModifiedDate: v.lastModifiedDate ? new Date(v.lastModifiedDate) : null,
                    referenceUrls: v.referenceUrls,
                    exploitAvailable: v.exploitAvailable,
                    epssScore: v.epssScore,
                    layerInfo: v.layerInfo,
                },
            });
        }
        await prisma.sBOM.update({
            where: { id: sbomRecord.id },
            data: { packageCount: result.vulnerabilities.length },
        });
        await prisma.scan.update({
            where: { id: scanId },
            data: { status: 'COMPLETED', completedAt: new Date(), progress: 100 },
        });
        await audit_service_1.auditService.record({
            action: 'SCAN_COMPLETED',
            entity: 'Scan',
            entityId: scanId,
            description: `Scan completed for ${imageRef}: ${result.vulnerabilities.length} vulnerabilities found`,
            metadata: { scanTime: result.scanTime, vulnCount: result.vulnerabilities.length },
        });
        await diff_service_1.diffService.computeAndStoreDiff(scanId).catch((err) => logger.warn({ err: err.message }, 'Diff computation failed'));
        await posture_service_1.postureService.computeSnapshot(scanId).catch((err) => logger.warn({ err: err.message }, 'Posture snapshot failed'));
        await assignment_service_1.assignmentService.autoResolveByScan(scanId).catch((err) => logger.warn({ err: err.message }, 'Auto-resolve assignments failed'));
        const scanDiff = await prisma.scanDiff.findUnique({ where: { scanId } });
        const isRegression = scanDiff?.regressionDetected || false;
        if (isRegression) {
            await webhook_service_1.webhookService.deliverEvent('scan.regression_detected', {
                scanId,
                imageRef,
                deltaScore: scanDiff.deltaScore,
                introducedCount: scanDiff.introducedCount,
            }).catch(() => { });
        }
        await webhook_service_1.webhookService.deliverEvent('scan.completed', {
            scanId,
            imageRef,
            status: 'COMPLETED',
            criticalCount: result.vulnerabilities.filter((v) => v.severity === 'CRITICAL').length,
            highCount: result.vulnerabilities.filter((v) => v.severity === 'HIGH').length,
            regressionDetected: isRegression,
            postureScore: 0,
        }).catch(() => { });
        const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, unknown: 0, total: result.vulnerabilities.length };
        for (const v of result.vulnerabilities) {
            const key = v.severity.toLowerCase();
            if (key in severityCounts)
                severityCounts[key]++;
        }
        await prisma.notification.create({
            data: {
                type: 'SCAN_COMPLETED',
                channel: 'EMAIL',
                subject: `Scan Complete - ${imageRef}`,
                body: JSON.stringify(severityCounts),
                metadata: { scanId, imageRef, ...severityCounts },
                userId: image.userId,
            },
        });
        const user = await prisma.user.findUnique({ where: { id: image.userId } });
        if (user?.email) {
            (0, email_1.sendScanCompletedEmail)(user.email, scanId, imageRef, severityCounts).catch((err) => logger.warn({ err: err.message }, 'Failed to send scan completion email'));
        }
        logger.info({ scanId, vulnCount: result.vulnerabilities.length, scanTime: result.scanTime }, 'Scan completed');
    }
    catch (error) {
        if (error.message === 'Scan was cancelled' || error.message.includes('cancelled')) {
            logger.info({ scanId }, 'Scan was cancelled, not retrying');
            const prisma = (0, prisma_1.getPrisma)();
            await prisma.scan.update({
                where: { id: scanId },
                data: { status: 'CANCELLED', completedAt: new Date(), errorMessage: 'Scan cancelled by user' },
            });
            return;
        }
        logger.error({ scanId, error: error.message }, 'Scan failed');
        const prisma = (0, prisma_1.getPrisma)();
        const scan = await prisma.scan.findUnique({ where: { id: scanId } });
        const maxRetries = scan?.maxRetries ?? 3;
        const retryCount = scan?.retryCount ?? 0;
        if (retryCount < maxRetries && scan?.status !== 'CANCELLED') {
            await prisma.scan.update({
                where: { id: scanId },
                data: { retryCount: retryCount + 1, errorMessage: error.message },
            });
            throw error;
        }
        await prisma.scan.update({
            where: { id: scanId },
            data: { status: 'FAILED', errorMessage: error.message, completedAt: new Date() },
        });
        await audit_service_1.auditService.record({
            action: 'SCAN_FAILED',
            entity: 'Scan',
            entityId: scanId,
            description: `Scan failed: ${error.message}`,
            metadata: { error: error.message },
        });
    }
}
async function processSbomJob(job) {
    const { sbomId, imageId, format } = job.data;
    logger.info({ sbomId, imageId, format }, 'Processing SBOM job');
    const prisma = (0, prisma_1.getPrisma)();
    try {
        const sbom = await prisma.sBOM.findUnique({ where: { id: sbomId } });
        if (!sbom)
            throw new Error('SBOM record not found');
        const image = await prisma.image.findUnique({ where: { id: imageId } });
        if (!image)
            throw new Error('Image not found');
        const imageRef = `${image.registry}/${image.repository}:${image.tag}`;
        const data = await (0, generator_1.generateTrivySbom)(imageRef, format.toLowerCase(), image.registryCredentials);
        const parsed = JSON.parse(data);
        await prisma.sBOM.update({
            where: { id: sbomId },
            data: {
                content: parsed,
                rawDocument: parsed,
                specVersion: parsed.specVersion || parsed.bomFormat || '1.5',
            },
        });
        await audit_service_1.auditService.record({
            action: 'SBOM_GENERATED',
            entity: 'SBOM',
            entityId: sbomId,
            description: `SBOM generated for ${imageRef}`,
        });
        logger.info({ sbomId, imageRef }, 'SBOM generated successfully');
    }
    catch (error) {
        logger.error({ sbomId, error: error.message }, 'SBOM generation failed');
        throw error;
    }
}
async function processReportJob(job) {
    const { reportId, scanId, imageId, title, format } = job.data;
    logger.info({ reportId, scanId, imageId, format }, 'Processing report job');
    const prisma = (0, prisma_1.getPrisma)();
    try {
        const generators = {
            pdf: pdf_1.generatePdfReport,
            csv: csv_1.generateCsvReport,
            json: json_1.generateJsonReport,
        };
        const generator = generators[format.toLowerCase()];
        if (!generator)
            throw new Error(`Unsupported report format: ${format}`);
        const result = await generator(title, scanId, imageId);
        await prisma.report.update({
            where: { id: reportId },
            data: {
                status: 'COMPLETED',
                filePath: result.filePath,
                fileSize: result.fileSize,
                generatedAt: new Date(),
            },
        });
        await audit_service_1.auditService.record({
            action: 'REPORT_GENERATED',
            entity: 'Report',
            entityId: reportId,
            description: `Report generated: ${title}`,
        });
        logger.info({ reportId, format }, 'Report generated successfully');
    }
    catch (error) {
        logger.error({ reportId, error: error.message }, 'Report generation failed');
        await prisma.report.update({
            where: { id: reportId },
            data: { status: 'FAILED' },
        });
    }
}
async function processLiveScanJob(job) {
    const { liveScanId, imageRef, policyId, registryCredentials, userId } = job.data;
    const logger = (0, logger_1.getLogger)();
    const prisma = (0, prisma_1.getPrisma)();
    try {
        await prisma.liveScan.update({ where: { id: liveScanId }, data: { status: 'PULLING', progress: 5 } });
        const { generateTrivySbom } = await import('@shared/sbom/generator');
        const sbomProgress = setInterval(async () => {
            try {
                const cur = await prisma.liveScan.findUnique({ where: { id: liveScanId }, select: { progress: true } });
                const next = Math.min((cur?.progress ?? 5) + 3, 35);
                await prisma.liveScan.update({ where: { id: liveScanId }, data: { progress: next } });
            }
            catch { }
        }, 10000);
        let sbomJson;
        try {
            const sbomResult = await generateTrivySbom(imageRef, 'cyclonedx', registryCredentials || null);
            sbomJson = JSON.parse(sbomResult);
        }
        finally {
            clearInterval(sbomProgress);
        }
        await prisma.liveScan.update({ where: { id: liveScanId }, data: { status: 'SCANNING', progress: 40 } });
        const { scanImage } = await import('@shared/scanner/trivy');
        const scanProgress = setInterval(async () => {
            try {
                const cur = await prisma.liveScan.findUnique({ where: { id: liveScanId }, select: { progress: true } });
                const next = Math.min((cur?.progress ?? 40) + 3, 68);
                await prisma.liveScan.update({ where: { id: liveScanId }, data: { progress: next } });
            }
            catch { }
        }, 15000);
        let result;
        try {
            result = await scanImage(imageRef, registryCredentials || null, liveScanId);
        }
        finally {
            clearInterval(scanProgress);
        }
        await prisma.liveScan.update({ where: { id: liveScanId }, data: { status: 'EVALUATING', progress: 70 } });
        const { policyService } = await import('@modules/policy/application/policy.service');
        const evaluation = policyId
            ? await policyService.evaluateVulnerabilities(result.vulnerabilities, policyId)
            : { passed: true, reason: 'No policy configured', blockingCVEs: [], policyName: '' };
        if (evaluation.passed) {
            const { getMinioClient } = await import('@shared/storage/minio');
            const { getEnv } = await import('@shared/config/env');
            const minio = getMinioClient();
            const env = getEnv();
            const tarballKey = `live-scans/${liveScanId}.tar.gz`;
            await minio.putObject(env.MINIO_BUCKET, tarballKey, JSON.stringify({ imageRef, vulnerabilities: result.vulnerabilities }));
            const presignedUrl = await minio.presignedGetObject(env.MINIO_BUCKET, tarballKey, 60 * 60);
            await prisma.liveScan.update({
                where: { id: liveScanId },
                data: {
                    status: 'PASSED', passed: true, progress: 100,
                    downloadUrl: presignedUrl, downloadExpiry: new Date(Date.now() + 60 * 60 * 1000),
                    completedAt: new Date(),
                },
            });
        }
        else {
            await prisma.liveScan.update({
                where: { id: liveScanId },
                data: {
                    status: 'BLOCKED', passed: false, progress: 100,
                    blockingReason: evaluation.reason,
                    completedAt: new Date(),
                },
            });
        }
    }
    catch (error) {
        logger.error({ liveScanId, error: error.message }, 'Live scan failed');
        await prisma.liveScan.update({
            where: { id: liveScanId },
            data: { status: 'FAILED', blockingReason: error.message, completedAt: new Date() },
        });
    }
}
async function startWorkers() {
    logger.info('Starting FortifyCI background workers');
    const prisma = (0, prisma_1.getPrisma)();
    const orphaned = await prisma.scan.findMany({
        where: { status: 'RUNNING' },
    });
    for (const scan of orphaned) {
        const age = Date.now() - (scan.startedAt?.getTime() ?? Date.now());
        logger.warn({ scanId: scan.id, age: `${Math.round(age / 1000)}s` }, 'Reconciling orphaned scan');
        await prisma.scan.update({
            where: { id: scan.id },
            data: {
                status: age > 300000 ? 'FAILED' : 'CANCELLED',
                completedAt: new Date(),
                errorMessage: 'Worker restarted - scan orphaned',
            },
        });
        await audit_service_1.auditService.record({
            action: 'SCAN_ORPHANED',
            entity: 'Scan',
            entityId: scan.id,
            description: `Scan marked as orphaned during worker startup`,
        });
    }
    if (orphaned.length > 0) {
        logger.info({ count: orphaned.length }, 'Reconciled orphaned scans');
    }
    (0, queue_1.createWorker)('scan', processScanJob);
    (0, queue_1.createWorker)('sbom', processSbomJob);
    (0, queue_1.createWorker)('report', processReportJob);
    (0, queue_1.createWorker)('live-scan', processLiveScanJob);
    logger.info('All workers started');
}
//# sourceMappingURL=worker.js.map