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
export declare class AuditService {
    record(entry: AuditLogEntry): Promise<void>;
    findByUser(userId: string, limit?: number, offset?: number): Promise<{
        id: string;
        action: string;
        entity: string;
        entityId: string | null;
        description: string | null;
        metadata: Prisma.JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        createdAt: Date;
        userId: string | null;
    }[]>;
    findByEntity(entity: string, entityId: string): Promise<{
        id: string;
        action: string;
        entity: string;
        entityId: string | null;
        description: string | null;
        metadata: Prisma.JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        createdAt: Date;
        userId: string | null;
    }[]>;
    search(params: {
        action?: string;
        entity?: string;
        userId?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{
        items: ({
            user: {
                username: string;
                id: string;
                email: string;
            } | null;
        } & {
            id: string;
            action: string;
            entity: string;
            entityId: string | null;
            description: string | null;
            metadata: Prisma.JsonValue | null;
            ipAddress: string | null;
            userAgent: string | null;
            createdAt: Date;
            userId: string | null;
        })[];
        total: number;
    }>;
}
export declare const auditService: AuditService;
//# sourceMappingURL=audit.service.d.ts.map