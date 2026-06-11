import { z } from 'zod';

export const registerImageSchema = z.object({
  name: z.string().min(1).max(255),
  tag: z.string().default('latest'),
  registry: z.string().default('docker.io'),
  repository: z.string().min(1).max(255),
  digest: z.string().optional(),
  architecture: z.string().optional(),
  os: z.string().optional(),
  mediaType: z.string().optional(),
  registryCredentials: z.object({
    username: z.string(),
    password: z.string(),
    serverAddress: z.string().optional(),
  }).optional(),
  manifest: z.any().optional(),
  config: z.any().optional(),
  labels: z.any().optional(),
});

export const imageQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  search: z.string().optional(),
  registry: z.string().optional(),
  sortBy: z.enum(['createdAt', 'name', 'tag']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type RegisterImageDto = z.infer<typeof registerImageSchema>;
export type ImageQueryDto = z.infer<typeof imageQuerySchema>;

export interface ImageResponse {
  id: string;
  name: string;
  tag: string;
  digest: string | null;
  registry: string;
  repository: string;
  architecture: string | null;
  os: string | null;
  size: string | null;
  mediaType: string | null;
  isSigned: boolean;
  labels: Record<string, unknown> | null;
  manifest: Record<string, unknown> | null;
  config: Record<string, unknown> | null;
  signatureInfo: Record<string, unknown> | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedImages {
  items: ImageResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
