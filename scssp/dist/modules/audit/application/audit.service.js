"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = exports.AuditService = void 0;
const prisma_1 = require("@shared/database/prisma");
class AuditService {
    async record(entry) {
        const prisma = (0, prisma_1.getPrisma)();
        await prisma.auditLog.create({
            data: entry,
        });
    }
    async findByUser(userId, limit = 50, offset = 0) {
        const prisma = (0, prisma_1.getPrisma)();
        return prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
    }
    async findByEntity(entity, entityId) {
        const prisma = (0, prisma_1.getPrisma)();
        return prisma.auditLog.findMany({
            where: { entity, entityId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async search(params) {
        const prisma = (0, prisma_1.getPrisma)();
        const where = {};
        if (params.action)
            where['action'] = params.action;
        if (params.entity)
            where['entity'] = params.entity;
        if (params.userId)
            where['userId'] = params.userId;
        if (params.startDate || params.endDate) {
            where['createdAt'] = {};
            if (params.startDate)
                where['createdAt']['gte'] = params.startDate;
            if (params.endDate)
                where['createdAt']['lte'] = params.endDate;
        }
        const [items, total] = await Promise.all([
            prisma.auditLog.findMany({
                where: where,
                orderBy: { createdAt: 'desc' },
                take: params.limit ?? 50,
                skip: params.offset ?? 0,
                include: { user: { select: { id: true, email: true, username: true } } },
            }),
            prisma.auditLog.count({ where: where }),
        ]);
        return { items, total };
    }
}
exports.AuditService = AuditService;
exports.auditService = new AuditService();
//# sourceMappingURL=audit.service.js.map