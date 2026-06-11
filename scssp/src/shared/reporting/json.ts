import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getPrisma } from '@shared/database/prisma';
import { getLogger } from '@shared/utils/logger';
import { ensureBucket, uploadFile } from '@shared/storage/minio';

const logger = getLogger();

export async function generateJsonReport(
  title: string,
  scanId: string | null,
  imageId: string | null,
  parameters?: Record<string, unknown>,
): Promise<{ filePath: string; fileSize: number }> {
  const prisma = getPrisma();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fortifyci-'));
  const reportId = crypto.randomUUID();

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
  const tmpPath = path.join(tmpDir, `${reportId}.json`);
  fs.writeFileSync(tmpPath, content, 'utf8');

  try {
    await ensureBucket();
    const objectName = `reports/${reportId}.json`;
    const buffer = fs.readFileSync(tmpPath);
    await uploadFile(objectName, buffer, buffer.length, 'application/json');
    fs.rmSync(tmpDir, { recursive: true, force: true });
    logger.info({ objectName, fileSize: buffer.length, vulnCount: vulnerabilities.length }, 'JSON report uploaded to MinIO');
    return { filePath: objectName, fileSize: buffer.length };
  } catch (err) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw err;
  }
}
