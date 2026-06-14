import { getPrisma } from '@shared/database/prisma';
import { auditService } from '@modules/audit/application/audit.service';
import { NotFoundError } from '@shared/errors';
import { getQueue } from '@shared/queue';
import type { CreateSbomDto, SbomQueryDto, SbomResponse, PaginatedSboms, PackageSearchResult } from '../domain/sbom.types';

export class SbomService {
  async generate(dto: CreateSbomDto, userId: string): Promise<SbomResponse> {
    const prisma = getPrisma();

    const image = await prisma.image.findUnique({ where: { id: dto.imageId } });
    if (!image || image.deletedAt) throw new NotFoundError('Image', dto.imageId);

    const sbom = await prisma.sBOM.create({
      data: {
        imageId: dto.imageId,
        format: dto.format as any,
        version: '1.0',
        specVersion: dto.specVersion,
        content: {},
        userId,
      },
    });

    const queue = getQueue('sbom');
    await queue.add('generate-sbom', { sbomId: sbom.id, imageId: dto.imageId, format: dto.format }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    await auditService.record({
      action: 'SBOM_GENERATED',
      entity: 'SBOM',
      entityId: sbom.id,
      description: `SBOM generation queued for ${image.registry}/${image.repository}:${image.tag}`,
      metadata: { format: dto.format },
      userId,
    });

    return this.mapSbomResponse(await prisma.sBOM.findUnique({
      where: { id: sbom.id },
      include: { image: { select: { id: true, name: true, tag: true, registry: true, repository: true } } },
    })!);
  }

  async findAll(query: SbomQueryDto): Promise<PaginatedSboms> {
    const prisma = getPrisma();
    const { page, limit, format, imageId, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (format) where.format = format;
    if (imageId) where.imageId = imageId;

    const [items, total] = await Promise.all([
      prisma.sBOM.findMany({
        where,
        include: { image: { select: { id: true, name: true, tag: true, registry: true, repository: true } } },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.sBOM.count({ where }),
    ]);

    return {
      items: items.map((s) => this.mapSbomResponse(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<SbomResponse> {
    const prisma = getPrisma();
    const sbom = await prisma.sBOM.findUnique({
      where: { id },
      include: { image: { select: { id: true, name: true, tag: true, registry: true, repository: true } } },
    });
    if (!sbom) throw new NotFoundError('SBOM', id);
    return this.mapSbomResponse(sbom);
  }

  async delete(id: string, userId: string): Promise<void> {
    const prisma = getPrisma();
    const sbom = await prisma.sBOM.findUnique({ where: { id } });
    if (!sbom) throw new NotFoundError('SBOM', id);

    await prisma.sBOM.delete({ where: { id } });

    await auditService.record({
      action: 'SBOM_DELETED',
      entity: 'SBOM',
      entityId: id,
      description: 'SBOM deleted',
      userId,
    });
  }

  async searchPackages(query: string, page = 1, limit = 50): Promise<{ items: PackageSearchResult[]; total: number; page: number; limit: number }> {
    const prisma = getPrisma();
    const skip = (page - 1) * limit;

    const where = {
      name: { contains: query, mode: 'insensitive' as const },
    };

    const [items, total] = await Promise.all([
      prisma.package.findMany({
        where,
        skip,
        take: limit,
        include: {
          scan: {
            select: {
              id: true,
              imageRef: true,
              image: { select: { id: true, name: true, tag: true, registry: true, repository: true } },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.package.count({ where }),
    ]);

    return {
      items: items.map((p) => ({
        id: p.id,
        name: p.name,
        version: p.version,
        ecosystem: p.ecosystem,
        purl: p.purl,
        scanId: p.scanId,
        imageRef: p.scan.imageRef,
        imageName: p.scan.image ? `${p.scan.image.registry}/${p.scan.image.repository}:${p.scan.image.tag}` : p.scan.imageRef,
      })),
      total,
      page,
      limit,
    };
  }

  private mapSbomResponse(sbom: any): SbomResponse {
    return {
      id: sbom.id,
      format: sbom.format,
      version: sbom.version,
      specVersion: sbom.specVersion,
      content: sbom.content as Record<string, unknown>,
      packageCount: sbom.packageCount,
      fileHash: sbom.fileHash,
      imageId: sbom.imageId,
      imageName: `${sbom.image.registry}/${sbom.image.repository}:${sbom.image.tag}`,
      userId: sbom.userId,
      createdAt: sbom.createdAt,
      updatedAt: sbom.updatedAt,
    };
  }
}

export const sbomService = new SbomService();
