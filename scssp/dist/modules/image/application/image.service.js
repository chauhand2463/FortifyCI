"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageService = exports.ImageService = void 0;
const prisma_1 = require("@shared/database/prisma");
const audit_service_1 = require("@modules/audit/application/audit.service");
const errors_1 = require("@shared/errors");
class ImageService {
    async register(dto, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const image = await prisma.image.create({
            data: {
                name: dto.name,
                tag: dto.tag,
                registry: dto.registry,
                repository: dto.repository,
                digest: dto.digest,
                architecture: dto.architecture,
                os: dto.os,
                mediaType: dto.mediaType,
                registryCredentials: dto.registryCredentials,
                manifest: dto.manifest ? JSON.parse(JSON.stringify(dto.manifest)) : undefined,
                config: dto.config ? JSON.parse(JSON.stringify(dto.config)) : undefined,
                labels: dto.labels ? JSON.parse(JSON.stringify(dto.labels)) : undefined,
                userId,
            },
        });
        await audit_service_1.auditService.record({
            action: 'IMAGE_REGISTERED',
            entity: 'Image',
            entityId: image.id,
            description: `Image registered: ${dto.registry}/${dto.repository}:${dto.tag}`,
            userId,
        });
        return this.mapImageResponse(image);
    }
    async findAll(query) {
        const prisma = (0, prisma_1.getPrisma)();
        const { page, limit, search, registry, sortBy, sortOrder } = query;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (registry)
            where.registry = registry;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { repository: { contains: search, mode: 'insensitive' } },
                { tag: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [items, total] = await Promise.all([
            prisma.image.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.image.count({ where }),
        ]);
        return {
            items: items.map((i) => this.mapImageResponse(i)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findById(id) {
        const prisma = (0, prisma_1.getPrisma)();
        const image = await prisma.image.findUnique({ where: { id } });
        if (!image || image.deletedAt)
            throw new errors_1.NotFoundError('Image', id);
        return this.mapImageResponse(image);
    }
    async delete(id, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const image = await prisma.image.findUnique({ where: { id } });
        if (!image || image.deletedAt)
            throw new errors_1.NotFoundError('Image', id);
        await prisma.image.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        await audit_service_1.auditService.record({
            action: 'IMAGE_DELETED',
            entity: 'Image',
            entityId: id,
            description: `Image deleted: ${image.registry}/${image.repository}:${image.tag}`,
            userId,
        });
    }
    mapImageResponse(image) {
        return {
            id: image.id,
            name: image.name,
            tag: image.tag,
            digest: image.digest,
            registry: image.registry,
            repository: image.repository,
            architecture: image.architecture,
            os: image.os,
            size: image.size?.toString() ?? null,
            mediaType: image.mediaType,
            isSigned: image.isSigned,
            labels: image.labels,
            manifest: image.manifest,
            config: image.config,
            signatureInfo: image.signatureInfo,
            userId: image.userId,
            createdAt: image.createdAt,
            updatedAt: image.updatedAt,
        };
    }
}
exports.ImageService = ImageService;
exports.imageService = new ImageService();
//# sourceMappingURL=image.service.js.map