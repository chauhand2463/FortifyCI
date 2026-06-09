import { getPrisma } from '@shared/database/prisma';
import { $Enums } from '@prisma/client';
import type { DashboardResponse } from '../domain/dashboard.types';

type VulnerabilityGroupBy = {
  severity: string;
  _count: { id: number };
};

async function getStats() {
  const prisma = getPrisma();

  const [totalImages, scannedImages, vulnAgg, fixesCount, atRiskImages] = await Promise.all([
    prisma.image.count({ where: { deletedAt: null } }),
    prisma.image.count({
      where: { deletedAt: null, scans: { some: {} } },
    }),
    prisma.vulnerability.groupBy({
      by: ['severity'],
      _count: { id: true },
    }) as unknown as VulnerabilityGroupBy[],
    prisma.vulnerability.count({
      where: { fixedVersion: { not: null } },
    }),
    prisma.image.count({
      where: {
        deletedAt: null,
        scans: {
          some: {
            vulnerabilities: {
              some: {
                severity: { in: ['CRITICAL', 'HIGH'] },
              },
            },
          },
        },
      },
    }),
  ]);

  const severityMap: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    UNKNOWN: 0,
  };
  for (const row of vulnAgg) {
    const key = row.severity.toUpperCase();
    if (key in severityMap) {
      severityMap[key] = row._count.id;
    }
  }

  const totalVulnerabilities = Object.values(severityMap).reduce((a, b) => a + b, 0);

  return {
    totalImages,
    scannedImages,
    totalVulnerabilities,
    criticalVulnerabilities: severityMap['CRITICAL'],
    highVulnerabilities: severityMap['HIGH'],
    mediumVulnerabilities: severityMap['MEDIUM'],
    lowVulnerabilities: severityMap['LOW'],
    fixesAvailable: fixesCount,
    imagesAtRisk: atRiskImages,
  };
}

async function getChartData() {
  const prisma = getPrisma();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [vulnAgg, recentScans, monthlyVulns] = await Promise.all([
    prisma.vulnerability.groupBy({
      by: ['severity'],
      _count: { id: true },
    }) as unknown as VulnerabilityGroupBy[],

    prisma.scan.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),

    prisma.vulnerability.findMany({
      select: { severity: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const severityColors: Record<string, string> = {
    CRITICAL: '#EF4444',
    HIGH: '#F59E0B',
    MEDIUM: '#3B82F6',
    LOW: '#6B7280',
    UNKNOWN: '#9098B8',
  };

  const severityLabels: Record<string, string> = {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
    UNKNOWN: 'Unknown',
  };

  const vulnerabilitySeverity = Object.entries(severityLabels)
    .filter(([key]) => key !== 'UNKNOWN')
    .map(([key, name]) => {
      const found = vulnAgg.find((r) => r.severity === key);
      return {
        name,
        value: found ? found._count.id : 0,
        color: severityColors[key],
      };
    });

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const scanTrendMap: Record<string, { scans: number; vulnerabilities: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    scanTrendMap[key] = { scans: 0, vulnerabilities: 0 };
  }

  for (const scan of recentScans) {
    const key = scan.createdAt.toISOString().slice(0, 10);
    if (scanTrendMap[key]) {
      scanTrendMap[key].scans += 1;
    }
  }

  for (const vuln of monthlyVulns) {
    const key = vuln.createdAt.toISOString().slice(0, 10);
    if (scanTrendMap[key]) {
      scanTrendMap[key].vulnerabilities += 1;
    }
  }

  const scanTrend = Object.entries(scanTrendMap).map(([date, data]) => ({
    date: date.slice(5),
    scans: data.scans,
    vulnerabilities: data.vulnerabilities,
  }));

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyMap: Record<string, { critical: number; high: number; medium: number; low: number }> = {};

  for (const vuln of monthlyVulns) {
    const key = `${vuln.createdAt.getFullYear()}-${String(vuln.createdAt.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyMap[key]) {
      monthlyMap[key] = { critical: 0, high: 0, medium: 0, low: 0 };
    }
    const sev = vuln.severity.toUpperCase();
    if (sev === 'CRITICAL') monthlyMap[key].critical += 1;
    else if (sev === 'HIGH') monthlyMap[key].high += 1;
    else if (sev === 'MEDIUM') monthlyMap[key].medium += 1;
    else if (sev === 'LOW') monthlyMap[key].low += 1;
  }

  const monthlySecurity = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => {
      const [, mm] = key.split('-');
      return {
        month: monthLabels[parseInt(mm, 10) - 1] || key,
        ...data,
      };
    });

  return { vulnerabilitySeverity, scanTrend, monthlySecurity };
}

export const dashboardService = {
  async getDashboard(): Promise<DashboardResponse> {
    const [stats, chartData] = await Promise.all([getStats(), getChartData()]);
    return { stats, chartData };
  },
};
