import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getPrisma } from '@shared/database/prisma';
import { getLogger } from '@shared/utils/logger';
import { ensureBucket, uploadFile } from '@shared/storage/minio';

const logger = getLogger();

function escapeCsv(value: string | number | boolean | null | undefined): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function generateCsvReport(
  title: string,
  scanId: string | null,
  imageId: string | null,
  parameters?: Record<string, unknown>,
): Promise<{ filePath: string; fileSize: number }> {
  const prisma = getPrisma();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fortifyci-'));
  const reportId = crypto.randomUUID();

  const rows: string[] = [];

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
  const where: Record<string, unknown> = {};
  if (effectiveScanId) where['scanId'] = effectiveScanId;
  if (imageId) where['scan'] = { imageId };

  const vulnerabilities = await prisma.vulnerability.findMany({
    where: where as any,
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

  const severityCounts: Record<string, number> = {};
  for (const v of vulnerabilities) {
    severityCounts[v.severity] = (severityCounts[v.severity] || 0) + 1;
  }
  for (const [sev, count] of Object.entries(severityCounts)) {
    rows.push(`# ${sev}: ${count}`);
  }

  const content = rows.join('\r\n');
  const tmpPath = path.join(tmpDir, `${reportId}.csv`);
  fs.writeFileSync(tmpPath, content, 'utf8');

  try {
    await ensureBucket();
    const objectName = `reports/${reportId}.csv`;
    const buffer = fs.readFileSync(tmpPath);
    await uploadFile(objectName, buffer, buffer.length, 'text/csv');
    fs.rmSync(tmpDir, { recursive: true, force: true });
    logger.info({ objectName, fileSize: buffer.length, vulnCount: vulnerabilities.length }, 'CSV report uploaded to MinIO');
    return { filePath: objectName, fileSize: buffer.length };
  } catch (err) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw err;
  }
}
