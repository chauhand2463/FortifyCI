import { getPrisma } from '@shared/database/prisma';
import { auditService } from '@modules/audit/application/audit.service';
import { NotFoundError, ValidationError } from '@shared/errors';
import { getQueue } from '@shared/queue';
import type { CreateScanDto, ScanQueryDto, ScanResponse, PaginatedScans } from '../domain/scan.types';

export class ScanService {
  async create(dto: CreateScanDto, userId: string): Promise<ScanResponse> {
    const prisma = getPrisma();

    const image = await prisma.image.findUnique({ where: { id: dto.imageId } });
    if (!image || image.deletedAt) throw new NotFoundError('Image', dto.imageId);

    const scan = await prisma.scan.create({
      data: {
        imageId: dto.imageId,
        imageRef: `${image.registry}/${image.repository}:${image.tag}`,
        scanType: dto.scanType,
        maxRetries: dto.maxRetries,
        metadata: dto.metadata ? JSON.parse(JSON.stringify(dto.metadata)) : undefined,
        userId,
      },
    });

    const queue = getQueue('scan');
    await queue.add('scan-image', { scanId: scan.id, imageId: dto.imageId }, {
      attempts: dto.maxRetries + 1,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    await prisma.scan.update({
      where: { id: scan.id },
      data: { status: 'QUEUED' },
    });

    await auditService.record({
      action: 'SCAN_CREATED',
      entity: 'Scan',
      entityId: scan.id,
      description: `Scan created for image: ${image.registry}/${image.repository}:${image.tag}`,
      metadata: { scanType: dto.scanType },
      userId,
    });

    return this.mapScanResponse(await prisma.scan.findUnique({
      where: { id: scan.id },
      include: { image: true, vulnerabilities: true },
    })!);
  }

  async findAll(query: ScanQueryDto): Promise<PaginatedScans> {
    const prisma = getPrisma();
    const { page, limit, status, imageId, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (imageId) where.imageId = imageId;

    const [items, total] = await Promise.all([
      prisma.scan.findMany({
        where,
        include: { image: { select: { id: true, name: true, tag: true, registry: true, repository: true } }, vulnerabilities: true },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.scan.count({ where }),
    ]);

    return {
      items: items.map((s) => this.mapScanResponse(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<ScanResponse> {
    const prisma = getPrisma();
    const scan = await prisma.scan.findUnique({
      where: { id },
      include: { image: { select: { id: true, name: true, tag: true, registry: true, repository: true } }, vulnerabilities: true },
    });
    if (!scan) throw new NotFoundError('Scan', id);
    return this.mapScanResponse(scan);
  }

  async cancelScan(id: string, userId: string): Promise<void> {
    const prisma = getPrisma();
    const scan = await prisma.scan.findUnique({ where: { id } });
    if (!scan) throw new NotFoundError('Scan', id);

    if (!['PENDING', 'QUEUED', 'RUNNING'].includes(scan.status)) {
      throw new ValidationError('Scan cannot be cancelled in its current state');
    }

    await prisma.scan.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    const queue = getQueue('scan');
    const jobs = await queue.getJobs(['active', 'waiting', 'delayed']);
    for (const job of jobs) {
      if (job.data.scanId === id) {
        await job.remove();
      }
    }

    await auditService.record({
      action: 'SCAN_CANCELLED',
      entity: 'Scan',
      entityId: id,
      description: `Scan cancelled: ${scan.imageRef}`,
      userId,
    });
  }

  private mapScanResponse(scan: any): ScanResponse {
    return {
      id: scan.id,
      imageId: scan.imageId,
      imageName: `${scan.image.registry}/${scan.image.repository}:${scan.image.tag}`,
      scanType: scan.scanType,
      status: scan.status,
      progress: scan.progress,
      errorMessage: scan.errorMessage,
      startedAt: scan.startedAt,
      completedAt: scan.completedAt,
      retryCount: scan.retryCount,
      maxRetries: scan.maxRetries,
      metadata: scan.metadata,
      vulnerabilitiesCount: scan.vulnerabilities.length,
      createdAt: scan.createdAt,
      updatedAt: scan.updatedAt,
    };
  }
}

export const scanService = new ScanService();
