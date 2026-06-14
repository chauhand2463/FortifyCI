"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyService = exports.ApiKeyService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const argon2_1 = require("@node-rs/argon2");
const prisma_1 = require("@shared/database/prisma");
const audit_service_1 = require("@modules/audit/application/audit.service");
const errors_1 = require("@shared/errors");
class ApiKeyService {
    async create(dto, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const rawKey = `fci_${crypto_1.default.randomBytes(32).toString('hex')}`;
        const keyHash = await (0, argon2_1.hash)(rawKey);
        const keyPrefix = rawKey.slice(0, 12);
        const apiKey = await prisma.apiKey.create({
            data: {
                name: dto.name,
                keyHash,
                keyPrefix,
                permissions: dto.permissions || [],
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                userId,
            },
        });
        await audit_service_1.auditService.record({
            action: 'API_KEY_CREATED',
            entity: 'ApiKey',
            entityId: apiKey.id,
            description: `API key created: ${apiKey.name}`,
            userId,
        });
        return {
            ...this.mapResponse(apiKey),
            key: rawKey,
        };
    }
    async findAll(query, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const { page, limit } = query;
        const skip = (page - 1) * limit;
        const where = { userId };
        const [items, total] = await Promise.all([
            prisma.apiKey.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.apiKey.count({ where }),
        ]);
        return {
            items: items.map((k) => this.mapResponse(k)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async delete(id, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const key = await prisma.apiKey.findFirst({
            where: { id, userId },
        });
        if (!key)
            throw new errors_1.NotFoundError('ApiKey', id);
        await prisma.apiKey.delete({ where: { id } });
        await audit_service_1.auditService.record({
            action: 'API_KEY_DELETED',
            entity: 'ApiKey',
            entityId: id,
            description: `API key deleted: ${key.name}`,
            userId,
        });
    }
    mapResponse(key) {
        return {
            id: key.id,
            name: key.name,
            keyPrefix: key.keyPrefix,
            permissions: key.permissions || [],
            lastUsedAt: key.lastUsedAt,
            expiresAt: key.expiresAt,
            isActive: key.isActive,
            createdAt: key.createdAt,
            updatedAt: key.updatedAt,
        };
    }
}
exports.ApiKeyService = ApiKeyService;
exports.apiKeyService = new ApiKeyService();
//# sourceMappingURL=api-key.service.js.map