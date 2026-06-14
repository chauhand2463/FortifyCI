"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const prisma_1 = require("@shared/database/prisma");
const errors_1 = require("@shared/errors");
class NotificationService {
    async findAll(query, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const { page, limit, isRead, type } = query;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (isRead !== undefined)
            where.isRead = isRead;
        if (type)
            where.type = type;
        const [items, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.notification.count({ where }),
        ]);
        return {
            items: items.map((n) => this.mapNotificationResponse(n)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async markAsRead(id, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const notification = await prisma.notification.findFirst({
            where: { id, userId },
        });
        if (!notification)
            throw new errors_1.NotFoundError('Notification', id);
        await prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }
    async markAllAsRead(userId) {
        const prisma = (0, prisma_1.getPrisma)();
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
    async getUnreadCount(userId) {
        const prisma = (0, prisma_1.getPrisma)();
        return prisma.notification.count({
            where: { userId, isRead: false },
        });
    }
    mapNotificationResponse(n) {
        return {
            id: n.id,
            type: n.type,
            channel: n.channel,
            subject: n.subject,
            body: n.body,
            metadata: n.metadata,
            isRead: n.isRead,
            sentAt: n.sentAt,
            errorMessage: n.errorMessage,
            userId: n.userId,
            createdAt: n.createdAt,
        };
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
//# sourceMappingURL=notification.service.js.map