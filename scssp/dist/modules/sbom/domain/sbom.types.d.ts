import { z } from 'zod';
export declare const createSbomSchema: z.ZodObject<{
    imageId: z.ZodString;
    format: z.ZodDefault<z.ZodEnum<["SPDX", "CYCLONEDX"]>>;
    specVersion: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    format: "SPDX" | "CYCLONEDX";
    imageId: string;
    specVersion: string;
}, {
    imageId: string;
    format?: "SPDX" | "CYCLONEDX" | undefined;
    specVersion?: string | undefined;
}>;
export declare const sbomQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    format: z.ZodOptional<z.ZodEnum<["SPDX", "CYCLONEDX"]>>;
    imageId: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["createdAt", "format"]>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "createdAt" | "format";
    sortOrder: "asc" | "desc";
    format?: "SPDX" | "CYCLONEDX" | undefined;
    imageId?: string | undefined;
}, {
    format?: "SPDX" | "CYCLONEDX" | undefined;
    imageId?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "createdAt" | "format" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type CreateSbomDto = z.infer<typeof createSbomSchema>;
export type SbomQueryDto = z.infer<typeof sbomQuerySchema>;
export interface PackageSearchResult {
    id: string;
    name: string;
    version: string;
    ecosystem: string;
    purl: string | null;
    scanId: string;
    imageRef: string;
    imageName: string;
}
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
//# sourceMappingURL=sbom.types.d.ts.map