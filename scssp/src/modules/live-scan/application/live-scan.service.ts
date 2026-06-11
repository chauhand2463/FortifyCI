import { getPrisma } from '@shared/database/prisma';
import { getQueue } from '@shared/queue';
import { auditService } from '@modules/audit/application/audit.service';
import { NotFoundError, ValidationError } from '@shared/errors';
import type { CreateLiveScanDto, LiveScanResponse } from '../domain/live-scan.types';

export class LiveScanService {
  async create(dto: CreateLiveScanDto, userId: string): Promise<LiveScanResponse> {
    const prisma = getPrisma();

    const liveScan = await prisma.liveScan.create({
      data: {
        requestedById: userId,
        imageRef: dto.imageRef,
        policyId: dto.policyId || null,
        status: 'PENDING',
        progress: 0,
      },
    });

    const queue = getQueue('scan');
    await queue.add('live-scan', {
      liveScanId: liveScan.id,
      imageRef: dto.imageRef,
      policyId: dto.policyId,
      registryCredentials: dto.registryCredentials,
      userId,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    await auditService.record({
      action: 'LIVE_SCAN_CREATED',
      entity: 'LiveScan',
      entityId: liveScan.id,
      description: `Live scan created for ${dto.imageRef}`,
      userId,
    });

    return this.mapResponse(liveScan);
  }

  async findById(id: string): Promise<LiveScanResponse> {
    const prisma = getPrisma();
    const scan = await prisma.liveScan.findUnique({ where: { id } });
    if (!scan) throw new NotFoundError('LiveScan', id);
    return this.mapResponse(scan);
  }

  async findByDigest(digest: string, userId: string): Promise<LiveScanResponse | null> {
    const prisma = getPrisma();
    const cached = await prisma.liveScan.findFirst({
      where: {
        imageDigest: digest,
        status: 'PASSED',
        completedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { completedAt: 'desc' },
    });
    if (!cached) return null;
    return this.mapResponse(cached);
  }

  async updateProgress(liveScanId: string, progress: number, status?: string): Promise<void> {
    const prisma = getPrisma();
    const data: Record<string, unknown> = { progress };
    if (status) data.status = status;
    await prisma.liveScan.update({ where: { id: liveScanId }, data });
  }

  async complete(liveScanId: string, passed: boolean, blockingReason?: string, downloadUrl?: string): Promise<void> {
    const prisma = getPrisma();
    const data: Record<string, unknown> = {
      status: passed ? 'PASSED' : 'BLOCKED',
      progress: 100,
      passed,
      completedAt: new Date(),
    };
    if (blockingReason) data.blockingReason = blockingReason;
    if (downloadUrl) {
      data.downloadUrl = downloadUrl;
      data.downloadExpiry = new Date(Date.now() + 60 * 60 * 1000);
    }
    await prisma.liveScan.update({ where: { id: liveScanId }, data });
  }

  async fail(liveScanId: string, error: string): Promise<void> {
    const prisma = getPrisma();
    await prisma.liveScan.update({
      where: { id: liveScanId },
      data: { status: 'FAILED', blockingReason: error, completedAt: new Date() },
    });
  }

  private mapResponse(s: any): LiveScanResponse {
    return {
      id: s.id,
      imageRef: s.imageRef,
      status: s.status,
      progress: s.progress,
      passed: s.passed,
      blockingReason: s.blockingReason,
      downloadUrl: s.downloadUrl,
      downloadExpiry: s.downloadExpiry?.toISOString() || null,
      createdAt: s.createdAt?.toISOString() || '',
      completedAt: s.completedAt?.toISOString() || null,
    };
  }
}

export const liveScanService = new LiveScanService();
