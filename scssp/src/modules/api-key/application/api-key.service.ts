import crypto from 'crypto';
import { hash } from '@node-rs/argon2';
import { getPrisma } from '@shared/database/prisma';
import { auditService } from '@modules/audit/application/audit.service';
import { NotFoundError, ValidationError } from '@shared/errors';
import type { CreateApiKeyDto, ApiKeyQueryDto, ApiKeyResponse, PaginatedApiKeys } from '../domain/api-key.types';

export class ApiKeyService {
  async create(dto: CreateApiKeyDto, userId: string): Promise<ApiKeyResponse & { key: string }> {
    const prisma = getPrisma();

    const rawKey = `fci_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = await hash(rawKey);
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

    await auditService.record({
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

  async findAll(query: ApiKeyQueryDto, userId: string): Promise<PaginatedApiKeys> {
    const prisma = getPrisma();
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

  async delete(id: string, userId: string): Promise<void> {
    const prisma = getPrisma();
    const key = await prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!key) throw new NotFoundError('ApiKey', id);

    await prisma.apiKey.delete({ where: { id } });

    await auditService.record({
      action: 'API_KEY_DELETED',
      entity: 'ApiKey',
      entityId: id,
      description: `API key deleted: ${key.name}`,
      userId,
    });
  }

  private mapResponse(key: Record<string, unknown>): ApiKeyResponse {
    return {
      id: key.id as string,
      name: key.name as string,
      keyPrefix: key.keyPrefix as string,
      permissions: (key.permissions as string[]) || [],
      lastUsedAt: key.lastUsedAt as Date | null,
      expiresAt: key.expiresAt as Date | null,
      isActive: key.isActive as boolean,
      createdAt: key.createdAt as Date,
      updatedAt: key.updatedAt as Date,
    };
  }
}

export const apiKeyService = new ApiKeyService();
