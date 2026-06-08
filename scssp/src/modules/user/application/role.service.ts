import { getPrisma } from '@shared/database/prisma';
import { auditService } from '@modules/audit/application/audit.service';
import { NotFoundError, ConflictError, ValidationError } from '@shared/errors';
import type { CreateRoleDto, UpdateRoleDto, RoleResponse } from '../domain/role.types';

export class RoleService {
  async create(dto: CreateRoleDto, actorId?: string): Promise<RoleResponse> {
    const prisma = getPrisma();

    const existing = await prisma.role.findUnique({ where: { name: dto.name as any } });
    if (existing) throw new ConflictError('Role name already exists');

    if (dto.permissions && dto.permissions.length > 0) {
      const permCount = await prisma.permission.count({
        where: { id: { in: dto.permissions } },
      });
      if (permCount !== dto.permissions.length) throw new ValidationError('One or more permissions not found');
    }

    const role = await prisma.role.create({
      data: {
        name: dto.name as any,
        description: dto.description,
        permissions: dto.permissions
          ? { create: dto.permissions.map((pid) => ({ permissionId: pid })) }
          : undefined,
      },
      include: { permissions: { include: { permission: true } } },
    });

    await auditService.record({
      action: 'ROLE_CREATED',
      entity: 'Role',
      entityId: role.id,
      description: `Role created: ${role.name}`,
      userId: actorId,
    });

    return this.mapRoleResponse(role);
  }

  async findAll(page = 1, limit = 20) {
    const prisma = getPrisma();
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.role.findMany({
        include: { permissions: { include: { permission: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.role.count(),
    ]);

    return {
      items: items.map((r) => this.mapRoleResponse(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<RoleResponse> {
    const prisma = getPrisma();
    const role = await prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundError('Role', id);
    return this.mapRoleResponse(role);
  }

  async update(id: string, dto: UpdateRoleDto, actorId?: string): Promise<RoleResponse> {
    const prisma = getPrisma();
    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Role', id);
    if (existing.isSystem) throw new ValidationError('Cannot modify system roles');

    if (dto.permissions !== undefined) {
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });

      if (dto.permissions.length > 0) {
        await prisma.rolePermission.createMany({
          data: dto.permissions.map((pid) => ({ roleId: id, permissionId: pid })),
        });
      }
    }

    if (dto.name) {
      await prisma.role.update({ where: { id }, data: { name: dto.name as any, description: dto.description } });
    }

    const role = await prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });

    await auditService.record({
      action: 'ROLE_UPDATED',
      entity: 'Role',
      entityId: id,
      description: `Role updated: ${role!.name}`,
      userId: actorId,
    });

    return this.mapRoleResponse(role!);
  }

  async delete(id: string, actorId?: string): Promise<void> {
    const prisma = getPrisma();
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundError('Role', id);
    if (role.isSystem) throw new ValidationError('Cannot delete system roles');

    const userCount = await prisma.user.count({ where: { roleId: id } });
    if (userCount > 0) throw new ValidationError('Cannot delete role with assigned users');

    await prisma.role.delete({ where: { id } });

    await auditService.record({
      action: 'ROLE_DELETED',
      entity: 'Role',
      entityId: id,
      description: `Role deleted: ${role.name}`,
      userId: actorId,
    });
  }

  private mapRoleResponse(role: any): RoleResponse {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map((rp: any) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}

export const roleService = new RoleService();
