import { createWorker } from '@shared/queue';
import { getPrisma } from '@shared/database/prisma';
import { getLogger } from '@shared/utils/logger';
import { auditService } from '@modules/audit/application/audit.service';
import { scanImage } from '@shared/scanner/trivy';
import { generateSpdxSbom, generateCycloneDxSbom } from '@shared/sbom/generator';
import { generatePdfReport } from '@shared/reporting/pdf';
import { generateCsvReport } from '@shared/reporting/csv';
import { generateJsonReport } from '@shared/reporting/json';
import { sendScanCompletedEmail } from '@shared/notifications/email';

const logger = getLogger();

async function processScanJob(job: any): Promise<void> {
  const { scanId, imageId } = job.data;
  logger.info({ scanId, imageId }, 'Processing real scan job');

  const prisma = getPrisma();

  try {
    const image = await prisma.image.findUnique({ where: { id: imageId } });
    if (!image) throw new Error('Image not found');

    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'RUNNING', startedAt: new Date(), progress: 10 },
    });

    const imageRef = `${image.registry}/${image.repository}:${image.tag}`;
    logger.info({ imageRef }, 'Starting Trivy vulnerability scan');

    await prisma.scan.update({
      where: { id: scanId },
      data: { progress: 30 },
    });

    const result = await scanImage(imageRef);

    await prisma.scan.update({
      where: { id: scanId },
      data: { progress: 70 },
    });

    const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, UNKNOWN: 4 };

    for (const v of result.vulnerabilities) {
      await prisma.vulnerability.create({
        data: {
          scanId,
          vulnerabilityId: v.vulnerabilityId,
          packageName: v.pkgName,
          packageVersion: v.installedVersion,
          packageType: v.pkgType,
          severity: v.severity as any,
          cvssScore: v.cvssScore,
          cvssVector: v.cvssVector,
          cweIds: v.cweIds as any,
          title: v.title,
          description: v.description,
          fixedVersion: v.fixedVersion,
          publishedDate: v.publishedDate ? new Date(v.publishedDate) : null,
          lastModifiedDate: v.lastModifiedDate ? new Date(v.lastModifiedDate) : null,
          referenceUrls: v.referenceUrls as any,
          exploitAvailable: v.exploitAvailable,
          epssScore: v.epssScore,
          layerInfo: v.layerInfo as any,
        },
      });
    }

    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'COMPLETED', completedAt: new Date(), progress: 100 },
    });

    await auditService.record({
      action: 'SCAN_COMPLETED',
      entity: 'Scan',
      entityId: scanId,
      description: `Scan completed for ${imageRef}: ${result.vulnerabilities.length} vulnerabilities found`,
      metadata: { scanTime: result.scanTime, vulnCount: result.vulnerabilities.length },
    });

    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, unknown: 0, total: result.vulnerabilities.length };
    for (const v of result.vulnerabilities) {
      const key = v.severity.toLowerCase() as keyof typeof severityCounts;
      if (key in severityCounts) severityCounts[key]++;
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
      sendScanCompletedEmail(user.email, scanId, imageRef, severityCounts).catch((err) =>
        logger.warn({ err: err.message }, 'Failed to send scan completion email'),
      );
    }

    logger.info({ scanId, vulnCount: result.vulnerabilities.length, scanTime: result.scanTime }, 'Scan completed');
  } catch (error: any) {
    logger.error({ scanId, error: error.message }, 'Scan failed');

    const prisma = getPrisma();
    const scan = await prisma.scan.findUnique({ where: { id: scanId } });
    const maxRetries = scan?.maxRetries ?? 3;
    const retryCount = scan?.retryCount ?? 0;

    if (retryCount < maxRetries) {
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

    await auditService.record({
      action: 'SCAN_FAILED',
      entity: 'Scan',
      entityId: scanId,
      description: `Scan failed: ${error.message}`,
      metadata: { error: error.message },
    });
  }
}

async function processSbomJob(job: any): Promise<void> {
  const { sbomId, imageId, format } = job.data;
  logger.info({ sbomId, imageId, format }, 'Processing real SBOM generation job');

  try {
    const prisma = getPrisma();
    const generator = format === 'CYCLONEDX' ? generateCycloneDxSbom : generateSpdxSbom;

    const result = await generator(imageId);

    await prisma.sBOM.update({
      where: { id: sbomId },
      data: {
        content: result.content as any,
        packageCount: result.packageCount,
        version: result.version,
      },
    });

    await auditService.record({
      action: 'SBOM_GENERATED',
      entity: 'SBOM',
      entityId: sbomId,
      description: `SBOM generated in ${format} format with ${result.packageCount} packages`,
      metadata: { format, packageCount: result.packageCount },
    });

    logger.info({ sbomId, format, packageCount: result.packageCount }, 'SBOM generated successfully');
  } catch (error: any) {
    logger.error({ sbomId, error: error.message }, 'SBOM generation failed');
    throw error;
  }
}

async function processReportJob(job: any): Promise<void> {
  const { reportId, format } = job.data;
  logger.info({ reportId, format }, 'Processing real report generation job');

  try {
    const prisma = getPrisma();

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error('Report not found');

    await prisma.report.update({
      where: { id: reportId },
      data: { status: 'GENERATING' },
    });

    let result: { filePath: string; fileSize: number };

    if (format === 'PDF') {
      result = await generatePdfReport(
        report.title,
        report.scanId,
        report.imageId,
        report.parameters as Record<string, unknown> | undefined,
      );
    } else if (format === 'JSON') {
      result = await generateJsonReport(
        report.title,
        report.scanId,
        report.imageId,
        report.parameters as Record<string, unknown> | undefined,
      );
    } else {
      result = await generateCsvReport(
        report.title,
        report.scanId,
        report.imageId,
        report.parameters as Record<string, unknown> | undefined,
      );
    }

    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'COMPLETED',
        filePath: result.filePath,
        fileSize: result.fileSize,
        generatedAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        type: 'REPORT_READY',
        channel: 'EMAIL',
        subject: `Report Ready - ${report.title}`,
        body: `Your ${format} report "${report.title}" has been generated and is ready for download.`,
        metadata: { reportId, format, fileSize: result.fileSize },
        userId: report.userId,
      },
    });

    logger.info({ reportId, format, fileSize: result.fileSize }, 'Report generated successfully');
  } catch (error: any) {
    logger.error({ reportId, error: error.message }, 'Report generation failed');
    const prisma = getPrisma();
    await prisma.report.update({
      where: { id: reportId },
      data: { status: 'FAILED' },
    });
  }
}

export async function startWorkers(): Promise<void> {
  logger.info('Starting real FortifyCI background workers');

  createWorker('scan', processScanJob);
  createWorker('sbom', processSbomJob);
  createWorker('report', processReportJob);

  logger.info('All workers started - ready to process real jobs');
}
