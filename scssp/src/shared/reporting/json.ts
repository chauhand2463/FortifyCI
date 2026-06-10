import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getEnv } from '@shared/config/env';
import { getPrisma } from '@shared/database/prisma';
import { getLogger } from '@shared/utils/logger';

const logger = getLogger();

export async function generateJsonReport(
  title: string,
  scanId: string | null,
  imageId: string | null,
  parameters?: Record<string, unknown>,
): Promise<{ filePath: string; fileSize: number }> {
  const prisma = getPrisma();
  const env = getEnv();
  const outputDir = path.resolve(env.REPORT_OUTPUT_DIR);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const reportId = crypto.randomUUID();
  const filePath = path.join(outputDir, `${reportId}.json`);

  const scan = scanId
    ? await prisma.scan.findUnique({ where: { id: scanId } })
    : await prisma.scan.findFirst({ orderBy: { createdAt: 'desc' } });

  const effectiveScanId = scanId || scan?.id || null;
  const where: Record<string, unknown> = {};
  if (effectiveScanId) where['scanId'] = effectiveScanId;
  if (imageId) where['scan'] = { imageId };

  const vulnerabilities = await prisma.vulnerability.findMany({
    where: where as any,
    include: { scan: { select: { imageRef: true } } },
    orderBy: [{ severity: 'desc' }, { cvssScore: 'desc' }],
  });

  const severityCounts: Record<string, number> = {};
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
  fs.writeFileSync(filePath, content, 'utf8');
  const stats = fs.statSync(filePath);

  logger.info({ filePath, fileSize: stats.size, vulnCount: vulnerabilities.length }, 'JSON report generated');
  return { filePath, fileSize: stats.size };
}
