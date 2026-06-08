import * as argon2 from 'argon2';
import { getEnv } from '@shared/config/env';
import { getPrisma } from '@shared/database/prisma';
import { auditService } from '@modules/audit/application/audit.service';
import { NotFoundError, ConflictError, ValidationError } from '@shared/errors';
import type { CreateUserDto, UpdateUserDto, UserQueryDto, UserResponse, PaginatedUsers } from '../domain/user.types';

export class UserService {
  async create(dto: CreateUserDto, actorId?: string): Promise<UserResponse> {
    const prisma = getPrisma();

    const existingEmail = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictError('Email already registered');

    const existingUsername = await prisma.user.findUnique({ where: { username: dto.username } });
    if (existingUsername) throw new ConflictError('Username already taken');

    const role = await prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) throw new ValidationError('Role not found');

    const env = getEnv();
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: env.ARGON2_MEMORY_COST,
      timeCost: env.ARGON2_TIME_COST,
      parallelism: env.ARGON2_PARALLELISM,
    });

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        roleId: dto.roleId,
        isActive: dto.isActive,
      },
      include: { role: { select: { id: true, name: true, description: true } } },
    });

    await auditService.record({
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user.id,
      description: `User created: ${user.email} with role ${role.name}`,
      userId: actorId,
    });

    return this.mapUserResponse(user);
  }

  async findAll(query: UserQueryDto): Promise<PaginatedUsers> {
    const prisma = getPrisma();
    const { page, limit, search, isActive, roleId, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (roleId) where.roleId = roleId;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { role: { select: { id: true, name: true, description: true } } },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u) => this.mapUserResponse(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<UserResponse> {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: { select: { id: true, name: true, description: true } } },
    });
    if (!user) throw new NotFoundError('User', id);
    return this.mapUserResponse(user);
  }

  async update(id: string, dto: UpdateUserDto, actorId?: string): Promise<UserResponse> {
    const prisma = getPrisma();

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('User', id);

    if (dto.email && dto.email !== existing.email) {
      const emailConflict = await prisma.user.findUnique({ where: { email: dto.email } });
      if (emailConflict) throw new ConflictError('Email already in use');
    }

    if (dto.username && dto.username !== existing.username) {
      const usernameConflict = await prisma.user.findUnique({ where: { username: dto.username } });
      if (usernameConflict) throw new ConflictError('Username already in use');
    }

    const user = await prisma.user.update({
      where: { id },
      data: dto,
      include: { role: { select: { id: true, name: true, description: true } } },
    });

    await auditService.record({
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: id,
      description: `User updated: ${user.email}`,
      metadata: dto as Record<string, unknown>,
      userId: actorId,
    });

    return this.mapUserResponse(user);
  }

  async delete(id: string, actorId?: string): Promise<void> {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User', id);

    await prisma.user.delete({ where: { id } });

    await auditService.record({
      action: 'USER_DELETED',
      entity: 'User',
      entityId: id,
      description: `User deleted: ${user.email}`,
      userId: actorId,
    });
  }

  private mapUserResponse(user: Record<string, unknown>): UserResponse {
    return {
      id: user.id as string,
      email: user.email as string,
      username: user.username as string,
      isActive: user.isActive as boolean,
      isVerified: user.isVerified as boolean,
      lastLoginAt: user.lastLoginAt as Date | null,
      role: user.role as UserResponse['role'],
      createdAt: user.createdAt as Date,
      updatedAt: user.updatedAt as Date,
    };
  }
}

export const userService = new UserService();
