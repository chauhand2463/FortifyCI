import { z } from 'zod';

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).optional().default([]),
  expiresAt: z.string().datetime().optional(),
});

export const apiKeyQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
});

export type CreateApiKeyDto = z.infer<typeof createApiKeySchema>;
export type ApiKeyQueryDto = z.infer<typeof apiKeyQuerySchema>;

export interface ApiKeyResponse {
  id: string;
  name: string;
  keyPrefix: string;
  key?: string;
  permissions: string[];
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedApiKeys {
  items: ApiKeyResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
