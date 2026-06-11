import { getPrisma } from '@shared/database/prisma';
import { getQueue } from '@shared/queue';
import { auditService } from '@modules/audit/application/audit.service';
import { webhookService } from '@modules/webhook/application/webhook.service';
import type { NvdWatchStatus, CveWatchResponse } from '../domain/nvd.types';

let isRunning = false;
let lastSyncAt: Date | null = null;

const NVD_API_BASE = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

export class NvdService {
  async getStatus(): Promise<NvdWatchStatus> {
    const prisma = getPrisma();
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [cves24h, rescans24h] = await Promise.all([
      prisma.cveWatch.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.scan.count({ where: { triggeredBy: 'NVD_WATCH', createdAt: { gte: dayAgo } } }),
    ]);

    return {
      lastSyncAt: lastSyncAt?.toISOString() || null,
      cvesProcessed24h: cves24h,
      rescansTriggered24h: rescans24h,
      isRunning,
    };
  }

  async getRecent(filters: { processed?: boolean; page?: number; limit?: number }): Promise<{ items: CveWatchResponse[]; total: number }> {
    const prisma = getPrisma();
    const { processed, page = 1, limit = 20 } = filters;
    const where: Record<string, unknown> = {};
    if (processed !== undefined) where.processed = processed;

    const [items, total] = await Promise.all([
      prisma.cveWatch.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cveWatch.count({ where }),
    ]);

    return {
      items: items.map((c) => ({
        id: c.id,
        cveId: c.cveId,
        publishedAt: c.publishedAt.toISOString(),
        severity: c.severity,
        cvssScore: c.cvssScore,
        affectedImages: c.affectedImages,
        rescanCount: c.rescanCount,
        processed: c.processed,
        processedAt: c.processedAt?.toISOString() || null,
        createdAt: c.createdAt.toISOString(),
      })),
      total,
    };
  }

  async sync(): Promise<void> {
    if (isRunning) return;
    isRunning = true;

    try {
      const prisma = getPrisma();
      const lastCve = await prisma.cveWatch.findFirst({ orderBy: { publishedAt: 'desc' } });
      const startDate = lastCve ? lastCve.publishedAt : new Date(Date.now() - 6 * 60 * 60 * 1000);

      const params = new URLSearchParams({
        lastModStartDate: startDate.toISOString(),
        lastModEndDate: new Date().toISOString(),
        resultsPerPage: '100',
      });

      const response = await fetch(`${NVD_API_BASE}?${params}`, {
        headers: { 'User-Agent': 'FortifyCI/2.0' },
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        lastSyncAt = new Date();
        return;
      }

      const data: any = await response.json();
      const vulnerabilities: any[] = data.vulnerabilities || [];

      const criticalHigh = vulnerabilities.filter((v: any) => {
        const metrics = v.cve?.metrics?.cvssMetricV31?.[0] || v.cve?.metrics?.cvssMetricV30?.[0] || v.cve?.metrics?.cvssMetricV2?.[0];
        return metrics?.cvssData?.baseSeverity === 'CRITICAL' || metrics?.cvssData?.baseSeverity === 'HIGH';
      });

      for (const vuln of criticalHigh) {
        const cveId = vuln.cve.id;
        const metrics = vuln.cve.metrics.cvssMetricV31?.[0] || vuln.cve.metrics.cvssMetricV30?.[0] || vuln.cve.metrics.cvssMetricV2?.[0];
        const severity = metrics?.cvssData?.baseSeverity || 'HIGH';
        const cvssScore = metrics?.cvssData?.baseScore || null;

        const existing = await prisma.cveWatch.findUnique({ where: { cveId } });
        if (existing) continue;

        const affectedImageIds = await this.findAffectedImages(cveId, prisma);

        const cveWatch = await prisma.cveWatch.create({
          data: {
            cveId,
            publishedAt: new Date(vuln.cve.published || vuln.cve.lastModified || Date.now()),
            severity: severity as any,
            cvssScore,
            affectedImages: affectedImageIds,
            rescanCount: 0,
            processed: false,
          },
        });

        if (affectedImageIds.length > 0) {
          const queue = getQueue('scan');
          let rescansQueued = 0;

          for (const imageId of affectedImageIds) {
            if (rescansQueued >= 20) break;

            const image = await prisma.image.findUnique({ where: { id: imageId } });
            if (!image) continue;

            const scan = await prisma.scan.create({
              data: {
                imageId: image.id,
                imageRef: `${image.registry}/${image.repository}:${image.tag}`,
                scanType: 'trivy',
                triggeredBy: 'NVD_WATCH',
                userId: (await prisma.user.findFirst({ where: { role: { name: 'ADMIN' } } }))?.id || '',
              },
            });

            await queue.add('scan-image', { scanId: scan.id, imageId: image.id }, {
              attempts: 3,
              backoff: { type: 'exponential', delay: 5000 },
            });

            await prisma.scan.update({ where: { id: scan.id }, data: { status: 'QUEUED' } });
            rescansQueued++;
          }

          await prisma.cveWatch.update({
            where: { id: cveWatch.id },
            data: { processed: true, processedAt: new Date(), rescanCount: rescansQueued },
          });

          await webhookService.deliverEvent('nvd.critical_cve_found', {
            cveId,
            severity,
            cvssScore,
            affectedImageCount: affectedImageIds.length,
            rescansQueued,
          });
        }
      }

      lastSyncAt = new Date();
    } catch (error) {
      console.error('NVD sync failed:', error);
    } finally {
      isRunning = false;
    }
  }

  private async findAffectedImages(cveId: string, prisma: any): Promise<string[]> {
    const recentVulns = await prisma.vulnerability.findMany({
      where: { vulnerabilityId: cveId },
      include: { scan: true },
    });

    const imageIds = new Set<string>();
    for (const v of recentVulns) {
      if (v.scan?.status === 'COMPLETED') {
        const scan = await prisma.scan.findUnique({ where: { id: v.scan.id }, select: { imageId: true } });
        if (scan) imageIds.add(scan.imageId);
      }
    }

    return Array.from(imageIds);
  }
}

export const nvdService = new NvdService();
