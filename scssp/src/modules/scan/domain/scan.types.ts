import { z } from 'zod';

export const createScanSchema = z.object({
  imageId: z.string().uuid(),
  scanType: z.string().default('trivy'),
  maxRetries: z.coerce.number().min(0).max(10).optional().default(3),
  metadata: z.any().optional(),
});

export const scanQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  status: z.string().optional(),
  imageId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'status', 'startedAt', 'completedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateScanDto = z.infer<typeof createScanSchema>;
export type ScanQueryDto = z.infer<typeof scanQuerySchema>;

export interface ScanResponse {
  id: string;
  imageId: string;
  imageName: string;
  scanType: string;
  status: string;
  progress: number;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  retryCount: number;
  maxRetries: number;
  metadata: Record<string, unknown> | null;
  vulnerabilitiesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedScans {
  items: ScanResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
