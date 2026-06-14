"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sbomService = exports.SbomService = void 0;
const prisma_1 = require("@shared/database/prisma");
const audit_service_1 = require("@modules/audit/application/audit.service");
const errors_1 = require("@shared/errors");
const queue_1 = require("@shared/queue");
class SbomService {
    async generate(dto, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const image = await prisma.image.findUnique({ where: { id: dto.imageId } });
        if (!image || image.deletedAt)
            throw new errors_1.NotFoundError('Image', dto.imageId);
        const sbom = await prisma.sBOM.create({
            data: {
                imageId: dto.imageId,
                format: dto.format,
                version: '1.0',
                specVersion: dto.specVersion,
                content: {},
                userId,
            },
        });
        const queue = (0, queue_1.getQueue)('sbom');
        await queue.add('generate-sbom', { sbomId: sbom.id, imageId: dto.imageId, format: dto.format }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
        });
        await audit_service_1.auditService.record({
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
        }));
    }
    async findAll(query) {
        const prisma = (0, prisma_1.getPrisma)();
        const { page, limit, format, imageId, sortBy, sortOrder } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (format)
            where.format = format;
        if (imageId)
            where.imageId = imageId;
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
    async findById(id) {
        const prisma = (0, prisma_1.getPrisma)();
        const sbom = await prisma.sBOM.findUnique({
            where: { id },
            include: { image: { select: { id: true, name: true, tag: true, registry: true, repository: true } } },
        });
        if (!sbom)
            throw new errors_1.NotFoundError('SBOM', id);
        return this.mapSbomResponse(sbom);
    }
    async delete(id, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const sbom = await prisma.sBOM.findUnique({ where: { id } });
        if (!sbom)
            throw new errors_1.NotFoundError('SBOM', id);
        await prisma.sBOM.delete({ where: { id } });
        await audit_service_1.auditService.record({
            action: 'SBOM_DELETED',
            entity: 'SBOM',
            entityId: id,
            description: 'SBOM deleted',
            userId,
        });
    }
    async searchPackages(query, page = 1, limit = 50) {
        const prisma = (0, prisma_1.getPrisma)();
        const skip = (page - 1) * limit;
        const where = {
            name: { contains: query, mode: 'insensitive' },
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
    mapSbomResponse(sbom) {
        return {
            id: sbom.id,
            format: sbom.format,
            version: sbom.version,
            specVersion: sbom.specVersion,
            content: sbom.content,
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
exports.SbomService = SbomService;
exports.sbomService = new SbomService();
//# sourceMappingURL=sbom.service.js.map