import { getPrisma } from '@shared/database/prisma';
import type { PermissionResponse } from '../domain/permission.types';

export class PermissionService {
  async findAll(): Promise<PermissionResponse[]> {
    const prisma = getPrisma();
    const permissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });
    return permissions.map((p: { id: string; name: string; description: string | null; createdAt: Date; updatedAt: Date }) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }
}

export const permissionService = new PermissionService();
