import { z } from 'zod';
export declare const createApiKeySchema: z.ZodObject<{
    name: z.ZodString;
    permissions: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    permissions: string[];
    expiresAt?: string | undefined;
}, {
    name: string;
    permissions?: string[] | undefined;
    expiresAt?: string | undefined;
}>;
export declare const apiKeyQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
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
//# sourceMappingURL=api-key.types.d.ts.map