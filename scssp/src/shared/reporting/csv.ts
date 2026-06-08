import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getEnv } from '@shared/config/env';
import { getPrisma } from '@shared/database/prisma';
import { getLogger } from '@shared/utils/logger';

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
  const env = getEnv();
  const outputDir = path.resolve(env.REPORT_OUTPUT_DIR);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const reportId = crypto.randomUUID();
  const filePath = path.join(outputDir, `${reportId}.csv`);

  const rows: string[] = [];

  rows.push(`# FortifyCI Vulnerability Report - ${title}`);
  rows.push(`# Generated: ${new Date().toISOString()}`);
  rows.push('');

  if (scanId) {
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: { image: true },
    });
    if (scan) {
      rows.push(`# Image: ${scan.imageRef}`);
      rows.push(`# Status: ${scan.status}`);
      rows.push(`# Scan Date: ${scan.completedAt?.toISOString() || 'N/A'}`);
      rows.push('');
    }
  }

  const where: Record<string, unknown> = {};
  if (scanId) where['scanId'] = scanId;
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
  fs.writeFileSync(filePath, content, 'utf8');
  const stats = fs.statSync(filePath);

  logger.info({ filePath, fileSize: stats.size, vulnCount: vulnerabilities.length }, 'CSV report generated');
  return { filePath, fileSize: stats.size };
}
