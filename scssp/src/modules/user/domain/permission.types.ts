import { z } from 'zod';

export const createPermissionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(255).optional(),
});

export type CreatePermissionDto = z.infer<typeof createPermissionSchema>;

export interface PermissionResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
