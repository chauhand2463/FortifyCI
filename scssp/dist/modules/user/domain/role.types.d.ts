import { z } from 'zod';
export declare const createRoleSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    permissions: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    permissions: string[];
    description?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    permissions?: string[] | undefined;
}>;
export declare const updateRoleSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    permissions?: string[] | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    permissions?: string[] | undefined;
}>;
export declare const roleQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
export interface RoleResponse {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    permissions: {
        id: string;
        name: string;
        description: string | null;
    }[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=role.types.d.ts.map