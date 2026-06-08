import { getPrisma } from '@shared/database/prisma';
import { getEnv } from '@shared/config/env';

let metricsCache: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000;

export async function collectMetrics(): Promise<string> {
  const now = Date.now();
  if (metricsCache && now - cacheTimestamp < CACHE_TTL) return metricsCache;

  const prisma = getPrisma();

  const [
    userCount,
    imageCount,
    scanCount,
    scanByStatus,
    vulnCount,
    vulnBySeverity,
    sbomCount,
    reportCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.image.count({ where: { deletedAt: null } }),
    prisma.scan.count(),
    prisma.scan.groupBy({ by: ['status'], _count: true }),
    prisma.vulnerability.count(),
    prisma.vulnerability.groupBy({ by: ['severity'], _count: true }),
    prisma.sBOM.count(),
    prisma.report.count(),
  ]);

  const env = getEnv();
  const lines: string[] = [
    '# HELP fortifyci_info FortifyCI application info',
    '# TYPE fortifyci_info gauge',
    `fortifyci_info{version="1.0.0",node_env="${env.NODE_ENV}"} 1`,
    '',
    '# HELP fortifyci_users_total Total number of users',
    '# TYPE fortifyci_users_total gauge',
    `fortifyci_users_total ${userCount}`,
    '',
    '# HELP fortifyci_images_total Total number of registered container images',
    '# TYPE fortifyci_images_total gauge',
    `fortifyci_images_total ${imageCount}`,
    '',
    '# HELP fortifyci_scans_total Total number of scans',
    '# TYPE fortifyci_scans_total gauge',
    `fortifyci_scans_total ${scanCount}`,
    '',
    '# HELP fortifyci_scans_by_status Scans grouped by status',
    '# TYPE fortifyci_scans_by_status gauge',
    ...scanByStatus.map((s) => `fortifyci_scans_by_status{status="${s.status}"} ${s._count}`),
    '',
    '# HELP fortifyci_vulnerabilities_total Total number of vulnerabilities',
    '# TYPE fortifyci_vulnerabilities_total gauge',
    `fortifyci_vulnerabilities_total ${vulnCount}`,
    '',
    '# HELP fortifyci_vulnerabilities_by_severity Vulnerabilities grouped by severity',
    '# TYPE fortifyci_vulnerabilities_by_severity gauge',
    ...vulnBySeverity.map((s) => `fortifyci_vulnerabilities_by_severity{severity="${s.severity}"} ${s._count}`),
    '',
    '# HELP fortifyci_sboms_total Total number of SBOMs generated',
    '# TYPE fortifyci_sboms_total gauge',
    `fortifyci_sboms_total ${sbomCount}`,
    '',
    '# HELP fortifyci_reports_total Total number of reports',
    '# TYPE fortifyci_reports_total gauge',
    `fortifyci_reports_total ${reportCount}`,
    '',
    '# HELP fortifyci_uptime_seconds Application uptime',
    '# TYPE fortifyci_uptime_seconds gauge',
    `fortifyci_uptime_seconds ${Math.floor(process.uptime())}`,
    '',
  ];

  metricsCache = lines.join('\n');
  cacheTimestamp = now;

  return metricsCache;
}
