import { z } from 'zod';

export const createReportSchema = z.object({
  title: z.string().min(1).max(255),
  format: z.enum(['PDF', 'CSV', 'JSON']).default('PDF'),
  scanId: z.string().uuid().optional(),
  imageId: z.string().uuid().optional(),
  parameters: z.object({
    includeVulnerabilities: z.boolean().optional().default(true),
    includeSbom: z.boolean().optional().default(true),
    severityFilter: z.array(z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'])).optional(),
    dateRange: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    }).optional(),
  }).optional(),
});

export const reportQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  format: z.enum(['PDF', 'CSV', 'JSON']).optional(),
  status: z.string().optional(),
});

export type CreateReportDto = z.infer<typeof createReportSchema>;
export type ReportQueryDto = z.infer<typeof reportQuerySchema>;

export interface ReportResponse {
  id: string;
  title: string;
  format: string;
  status: string;
  parameters: Record<string, unknown> | null;
  filePath: string | null;
  fileSize: number | null;
  generatedAt: Date | null;
  scanId: string | null;
  imageId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedReports {
  items: ReportResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
