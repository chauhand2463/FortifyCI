"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exceptionService = exports.ExceptionService = void 0;
const prisma_1 = require("@shared/database/prisma");
const audit_service_1 = require("@modules/audit/application/audit.service");
const errors_1 = require("@shared/errors");
class ExceptionService {
    async create(dto, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        if (dto.reason.length < 50)
            throw new errors_1.ValidationError('Reason must be at least 50 characters');
        if (dto.approvedById === userId)
            throw new errors_1.ValidationError('Creator cannot be the approver (two-person rule)');
        const expiresAt = new Date(dto.expiresAt);
        const maxExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        if (expiresAt > maxExpiry)
            throw new errors_1.ValidationError('Expiry date cannot exceed 1 year from now');
        const exception = await prisma.vulnerabilityException.create({
            data: {
                cveId: dto.cveId,
                imageId: dto.imageId || null,
                reason: dto.reason,
                createdById: userId,
                approvedById: dto.approvedById || null,
                expiresAt,
                isActive: false,
            },
            include: {
                createdBy: { select: { id: true, username: true } },
                approvedBy: { select: { id: true, username: true } },
                image: { select: { id: true, name: true, tag: true, registry: true, repository: true } },
            },
        });
        await audit_service_1.auditService.record({
            action: 'EXCEPTION_CREATED',
            entity: 'VulnerabilityException',
            entityId: exception.id,
            description: `Exception created for CVE ${dto.cveId}${dto.imageId ? ' (scoped to image)' : ' (global)'}`,
            userId,
        });
        return this.mapResponse(exception);
    }
    async findAll(filters) {
        const prisma = (0, prisma_1.getPrisma)();
        const { isActive, cveId, page = 1, limit = 20 } = filters;
        const where = {};
        if (isActive !== undefined)
            where.isActive = isActive;
        if (cveId)
            where.cveId = cveId;
        const [items, total] = await Promise.all([
            prisma.vulnerabilityException.findMany({
                where,
                include: {
                    createdBy: { select: { id: true, username: true } },
                    approvedBy: { select: { id: true, username: true } },
                    image: { select: { id: true, name: true, tag: true, registry: true, repository: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.vulnerabilityException.count({ where }),
        ]);
        return { items: items.map((e) => this.mapResponse(e)), total };
    }
    async findById(id) {
        const prisma = (0, prisma_1.getPrisma)();
        const exception = await prisma.vulnerabilityException.findUnique({
            where: { id },
            include: {
                createdBy: { select: { id: true, username: true } },
                approvedBy: { select: { id: true, username: true } },
                image: { select: { id: true, name: true, tag: true, registry: true, repository: true } },
            },
        });
        if (!exception)
            throw new errors_1.NotFoundError('Exception', id);
        return this.mapResponse(exception);
    }
    async approve(id, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const exception = await prisma.vulnerabilityException.findUnique({ where: { id } });
        if (!exception)
            throw new errors_1.NotFoundError('Exception', id);
        if (exception.createdById === userId)
            throw new errors_1.ForbiddenError('Cannot approve your own exception');
        if (exception.isActive)
            throw new errors_1.ValidationError('Exception is already approved');
        const updated = await prisma.vulnerabilityException.update({
            where: { id },
            data: { isActive: true, approvedById: userId, approvedAt: new Date() },
            include: {
                createdBy: { select: { id: true, username: true } },
                approvedBy: { select: { id: true, username: true } },
                image: { select: { id: true, name: true, tag: true, registry: true, repository: true } },
            },
        });
        await prisma.notification.create({
            data: {
                type: 'EXCEPTION_APPROVED',
                channel: 'EMAIL',
                subject: `Exception Approved: ${exception.cveId}`,
                body: `Your exception for CVE ${exception.cveId} has been approved by user ${userId}`,
                metadata: { exceptionId: id },
                userId: exception.createdById,
            },
        });
        await audit_service_1.auditService.record({
            action: 'EXCEPTION_APPROVED',
            entity: 'VulnerabilityException',
            entityId: id,
            description: `Exception for CVE ${exception.cveId} approved`,
            userId,
        });
        return this.mapResponse(updated);
    }
    async revoke(id, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const exception = await prisma.vulnerabilityException.findUnique({ where: { id } });
        if (!exception)
            throw new errors_1.NotFoundError('Exception', id);
        const updated = await prisma.vulnerabilityException.update({
            where: { id },
            data: { isActive: false, revokedAt: new Date(), revokedById: userId },
            include: {
                createdBy: { select: { id: true, username: true } },
                approvedBy: { select: { id: true, username: true } },
                image: { select: { id: true, name: true, tag: true, registry: true, repository: true } },
            },
        });
        await audit_service_1.auditService.record({
            action: 'EXCEPTION_REVOKED',
            entity: 'VulnerabilityException',
            entityId: id,
            description: `Exception for CVE ${exception.cveId} revoked`,
            userId,
        });
        return this.mapResponse(updated);
    }
    async processExpiredExceptions() {
        const prisma = (0, prisma_1.getPrisma)();
        const now = new Date();
        const expired = await prisma.vulnerabilityException.findMany({
            where: { expiresAt: { lt: now }, isActive: true },
        });
        for (const e of expired) {
            await prisma.vulnerabilityException.update({
                where: { id: e.id },
                data: { isActive: false },
            });
            await prisma.notification.create({
                data: {
                    type: 'EXCEPTION_EXPIRED',
                    channel: 'EMAIL',
                    subject: `Exception Expired: ${e.cveId}`,
                    body: `Exception for CVE ${e.cveId} has expired. Please re-evaluate.`,
                    metadata: { exceptionId: e.id },
                    userId: e.createdById,
                },
            });
        }
        return expired.length;
    }
    mapResponse(e) {
        return {
            id: e.id,
            cveId: e.cveId,
            imageId: e.imageId || null,
            imageRef: e.image ? `${e.image.registry}/${e.image.repository}:${e.image.tag}` : null,
            reason: e.reason,
            createdBy: e.createdBy,
            approvedBy: e.approvedBy,
            approvedAt: e.approvedAt?.toISOString() || null,
            isActive: e.isActive,
            expiresAt: e.expiresAt?.toISOString() || '',
            revokedAt: e.revokedAt?.toISOString() || null,
            createdAt: e.createdAt?.toISOString() || '',
        };
    }
}
exports.ExceptionService = ExceptionService;
exports.exceptionService = new ExceptionService();
//# sourceMappingURL=exception.service.js.map