import { z } from 'zod';

export const createSbomSchema = z.object({
  imageId: z.string().uuid(),
  format: z.enum(['SPDX', 'CYCLONEDX']).default('SPDX'),
  specVersion: z.string().optional().default('2.3'),
});

export const sbomQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  format: z.enum(['SPDX', 'CYCLONEDX']).optional(),
  imageId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'format']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateSbomDto = z.infer<typeof createSbomSchema>;
export type SbomQueryDto = z.infer<typeof sbomQuerySchema>;

export interface SbomResponse {
  id: string;
  format: string;
  version: string;
  specVersion: string | null;
  content: Record<string, unknown>;
  packageCount: number | null;
  fileHash: string | null;
  imageId: string;
  imageName: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedSboms {
  items: SbomResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
