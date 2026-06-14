import { z } from 'zod';
export declare const registerImageSchema: z.ZodObject<{
    name: z.ZodString;
    tag: z.ZodDefault<z.ZodString>;
    registry: z.ZodDefault<z.ZodString>;
    repository: z.ZodString;
    digest: z.ZodOptional<z.ZodString>;
    architecture: z.ZodOptional<z.ZodString>;
    os: z.ZodOptional<z.ZodString>;
    mediaType: z.ZodOptional<z.ZodString>;
    registryCredentials: z.ZodOptional<z.ZodObject<{
        username: z.ZodString;
        password: z.ZodString;
        serverAddress: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        password: string;
        username: string;
        serverAddress?: string | undefined;
    }, {
        password: string;
        username: string;
        serverAddress?: string | undefined;
    }>>;
    manifest: z.ZodOptional<z.ZodAny>;
    config: z.ZodOptional<z.ZodAny>;
    labels: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    name: string;
    tag: string;
    registry: string;
    repository: string;
    digest?: string | undefined;
    architecture?: string | undefined;
    os?: string | undefined;
    mediaType?: string | undefined;
    manifest?: any;
    config?: any;
    labels?: any;
    registryCredentials?: {
        password: string;
        username: string;
        serverAddress?: string | undefined;
    } | undefined;
}, {
    name: string;
    repository: string;
    digest?: string | undefined;
    tag?: string | undefined;
    registry?: string | undefined;
    architecture?: string | undefined;
    os?: string | undefined;
    mediaType?: string | undefined;
    manifest?: any;
    config?: any;
    labels?: any;
    registryCredentials?: {
        password: string;
        username: string;
        serverAddress?: string | undefined;
    } | undefined;
}>;
export declare const imageQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    search: z.ZodOptional<z.ZodString>;
    registry: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["createdAt", "name", "tag"]>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "name" | "createdAt" | "tag";
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    registry?: string | undefined;
}, {
    search?: string | undefined;
    registry?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "name" | "createdAt" | "tag" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
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
//# sourceMappingURL=image.types.d.ts.map