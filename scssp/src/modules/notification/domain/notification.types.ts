import { z } from 'zod';

export const notificationQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  isRead: z.coerce.boolean().optional(),
  type: z.string().optional(),
});

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
