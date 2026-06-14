"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const argon2_1 = require("@node-rs/argon2");
const env_1 = require("@shared/config/env");
const prisma_1 = require("@shared/database/prisma");
const audit_service_1 = require("@modules/audit/application/audit.service");
const errors_1 = require("@shared/errors");
class UserService {
    async create(dto, actorId) {
        const prisma = (0, prisma_1.getPrisma)();
        const existingEmail = await prisma.user.findUnique({ where: { email: dto.email } });
        if (existingEmail)
            throw new errors_1.ConflictError('Email already registered');
        const existingUsername = await prisma.user.findUnique({ where: { username: dto.username } });
        if (existingUsername)
            throw new errors_1.ConflictError('Username already taken');
        const role = await prisma.role.findUnique({ where: { id: dto.roleId } });
        if (!role)
            throw new errors_1.ValidationError('Role not found');
        const env = (0, env_1.getEnv)();
        const passwordHash = await (0, argon2_1.hash)(dto.password, {
            algorithm: 2,
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
        await audit_service_1.auditService.record({
            action: 'USER_CREATED',
            entity: 'User',
            entityId: user.id,
            description: `User created: ${user.email} with role ${role.name}`,
            userId: actorId,
        });
        return this.mapUserResponse(user);
    }
    async findAll(query) {
        const prisma = (0, prisma_1.getPrisma)();
        const { page, limit, search, isActive, roleId, sortBy, sortOrder } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (isActive !== undefined)
            where.isActive = isActive;
        if (roleId)
            where.roleId = roleId;
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
    async findById(id) {
        const prisma = (0, prisma_1.getPrisma)();
        const user = await prisma.user.findUnique({
            where: { id },
            include: { role: { select: { id: true, name: true, description: true } } },
        });
        if (!user)
            throw new errors_1.NotFoundError('User', id);
        return this.mapUserResponse(user);
    }
    async update(id, dto, actorId) {
        const prisma = (0, prisma_1.getPrisma)();
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing)
            throw new errors_1.NotFoundError('User', id);
        if (dto.email && dto.email !== existing.email) {
            const emailConflict = await prisma.user.findUnique({ where: { email: dto.email } });
            if (emailConflict)
                throw new errors_1.ConflictError('Email already in use');
        }
        if (dto.username && dto.username !== existing.username) {
            const usernameConflict = await prisma.user.findUnique({ where: { username: dto.username } });
            if (usernameConflict)
                throw new errors_1.ConflictError('Username already in use');
        }
        const user = await prisma.user.update({
            where: { id },
            data: dto,
            include: { role: { select: { id: true, name: true, description: true } } },
        });
        await audit_service_1.auditService.record({
            action: 'USER_UPDATED',
            entity: 'User',
            entityId: id,
            description: `User updated: ${user.email}`,
            metadata: dto,
            userId: actorId,
        });
        return this.mapUserResponse(user);
    }
    async delete(id, actorId) {
        const prisma = (0, prisma_1.getPrisma)();
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new errors_1.NotFoundError('User', id);
        await prisma.user.delete({ where: { id } });
        await audit_service_1.auditService.record({
            action: 'USER_DELETED',
            entity: 'User',
            entityId: id,
            description: `User deleted: ${user.email}`,
            userId: actorId,
        });
    }
    mapUserResponse(user) {
        return {
            id: user.id,
            email: user.email,
            username: user.username,
            isActive: user.isActive,
            isVerified: user.isVerified,
            lastLoginAt: user.lastLoginAt,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
//# sourceMappingURL=user.service.js.map