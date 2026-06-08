import { getPrisma } from '@shared/database/prisma';
import { Prisma } from '@prisma/client';

export interface AuditLogEntry {
  action: string;
  entity: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
}

export class AuditService {
  async record(entry: AuditLogEntry): Promise<void> {
    const prisma = getPrisma();
    await prisma.auditLog.create({
      data: entry as Prisma.AuditLogCreateInput,
    });
  }

  async findByUser(userId: string, limit = 50, offset = 0) {
    const prisma = getPrisma();
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async findByEntity(entity: string, entityId: string) {
    const prisma = getPrisma();
    return prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async search(params: {
    action?: string;
    entity?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const prisma = getPrisma();
    const where: Record<string, unknown> = {};
    if (params.action) where['action'] = params.action;
    if (params.entity) where['entity'] = params.entity;
    if (params.userId) where['userId'] = params.userId;
    if (params.startDate || params.endDate) {
      where['createdAt'] = {};
      if (params.startDate) (where['createdAt'] as Record<string, unknown>)['gte'] = params.startDate;
      if (params.endDate) (where['createdAt'] as Record<string, unknown>)['lte'] = params.endDate;
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        take: params.limit ?? 50,
        skip: params.offset ?? 0,
        include: { user: { select: { id: true, email: true, username: true } } },
      }),
      prisma.auditLog.count({ where: where as any }),
    ]);

    return { items, total };
  }
}

export const auditService = new AuditService();
