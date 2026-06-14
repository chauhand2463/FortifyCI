import type { NotificationQueryDto, PaginatedNotifications } from '../domain/notification.types';
export declare class NotificationService {
    findAll(query: NotificationQueryDto, userId: string): Promise<PaginatedNotifications>;
    markAsRead(id: string, userId: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
    private mapNotificationResponse;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notification.service.d.ts.map