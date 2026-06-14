import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
    roleId: z.ZodString;
    isActive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    password: string;
    username: string;
    isActive: boolean;
    email: string;
    roleId: string;
}, {
    password: string;
    username: string;
    email: string;
    roleId: string;
    isActive?: boolean | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    roleId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    username?: string | undefined;
    isActive?: boolean | undefined;
    email?: string | undefined;
    roleId?: string | undefined;
}, {
    username?: string | undefined;
    isActive?: boolean | undefined;
    email?: string | undefined;
    roleId?: string | undefined;
}>;
export declare const userQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    search: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    roleId: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["createdAt", "email", "username"]>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "username" | "createdAt" | "email";
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    isActive?: boolean | undefined;
    roleId?: string | undefined;
}, {
    search?: string | undefined;
    isActive?: boolean | undefined;
    roleId?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "username" | "createdAt" | "email" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UserQueryDto = z.infer<typeof userQuerySchema>;
export interface UserResponse {
    id: string;
    email: string;
    username: string;
    isActive: boolean;
    isVerified: boolean;
    lastLoginAt: Date | null;
    role: {
        id: string;
        name: string;
        description: string | null;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface PaginatedUsers {
    items: UserResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
//# sourceMappingURL=user.types.d.ts.map