import { z } from 'zod';
export declare const createScanSchema: z.ZodObject<{
    imageId: z.ZodString;
    scanType: z.ZodDefault<z.ZodString>;
    maxRetries: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    metadata: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    scanType: string;
    maxRetries: number;
    imageId: string;
    metadata?: any;
}, {
    imageId: string;
    metadata?: any;
    scanType?: string | undefined;
    maxRetries?: number | undefined;
}>;
export declare const scanQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodString>;
    imageId: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["createdAt", "status", "startedAt", "completedAt"]>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "status" | "createdAt" | "startedAt" | "completedAt";
    sortOrder: "asc" | "desc";
    status?: string | undefined;
    imageId?: string | undefined;
}, {
    status?: string | undefined;
    imageId?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "status" | "createdAt" | "startedAt" | "completedAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
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
    triggeredBy: string | null;
    metadata: Record<string, unknown> | null;
    vulnerabilitiesCount: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    regressionDetected: boolean;
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
//# sourceMappingURL=scan.types.d.ts.map