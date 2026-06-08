import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(12).max(128),
  roleId: z.string().uuid(),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).max(50).optional(),
  isActive: z.boolean().optional(),
  roleId: z.string().uuid().optional(),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  roleId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'email', 'username']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

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
