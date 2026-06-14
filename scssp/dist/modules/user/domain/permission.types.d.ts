import { z } from 'zod';
export declare const createPermissionSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
}>;
export type CreatePermissionDto = z.infer<typeof createPermissionSchema>;
export interface PermissionResponse {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=permission.types.d.ts.map