import { z } from 'zod';
export declare const notificationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    isRead: z.ZodOptional<z.ZodBoolean>;
    type: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    type?: string | undefined;
    isRead?: boolean | undefined;
}, {
    type?: string | undefined;
    isRead?: boolean | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type NotificationQueryDto = z.infer<typeof notificationQuerySchema>;
export interface NotificationResponse {
    id: string;
    type: string;
    channel: string;
    subject: string;
    body: string;
    metadata: Record<string, unknown> | null;
    isRead: boolean;
    sentAt: Date | null;
    errorMessage: string | null;
    userId: string;
    createdAt: Date;
}
export interface PaginatedNotifications {
    items: NotificationResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
//# sourceMappingURL=notification.types.d.ts.map