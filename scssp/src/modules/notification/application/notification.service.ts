import { getPrisma } from '@shared/database/prisma';
import { NotFoundError } from '@shared/errors';
import type { NotificationQueryDto, NotificationResponse, PaginatedNotifications } from '../domain/notification.types';

export class NotificationService {
  async findAll(query: NotificationQueryDto, userId: string): Promise<PaginatedNotifications> {
    const prisma = getPrisma();
    const { page, limit, isRead, type } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };
    if (isRead !== undefined) where.isRead = isRead;
    if (type) where.type = type;

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

  async markAsRead(id: string, userId: string): Promise<void> {
    const prisma = getPrisma();
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundError('Notification', id);

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const prisma = getPrisma();
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    const prisma = getPrisma();
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  private mapNotificationResponse(n: any): NotificationResponse {
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

export const notificationService = new NotificationService();
