"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignmentService = exports.AssignmentService = void 0;
const prisma_1 = require("@shared/database/prisma");
const audit_service_1 = require("@modules/audit/application/audit.service");
const errors_1 = require("@shared/errors");
class AssignmentService {
    async create(dto, assignedById) {
        const prisma = (0, prisma_1.getPrisma)();
        const vuln = await prisma.vulnerability.findUnique({
            where: { id: dto.vulnerabilityId },
            include: { scan: { include: { image: true } } },
        });
        if (!vuln)
            throw new errors_1.NotFoundError('Vulnerability', dto.vulnerabilityId);
        const existing = await prisma.vulnerabilityAssignment.findUnique({ where: { vulnerabilityId: dto.vulnerabilityId } });
        if (existing)
            throw new errors_1.ValidationError('This vulnerability already has an active assignment');
        const assignedTo = await prisma.user.findUnique({ where: { id: dto.assignedToId } });
        if (!assignedTo)
            throw new errors_1.NotFoundError('User', dto.assignedToId);
        const policy = await prisma.scanPolicy.findFirst({ where: { isDefault: true } });
        const slaMap = {
            CRITICAL: policy?.slaCriticalDays ?? 7,
            HIGH: policy?.slaHighDays ?? 30,
            MEDIUM: policy?.slaMediumDays ?? 90,
        };
        const slaDays = slaMap[vuln.severity] || 999;
        const slaDeadline = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000);
        const assignment = await prisma.vulnerabilityAssignment.create({
            data: {
                vulnerabilityId: dto.vulnerabilityId,
                assignedToId: dto.assignedToId,
                assignedById,
                slaDeadline,
                notes: dto.notes,
            },
            include: {
                vulnerability: true,
                assignedTo: { select: { id: true, username: true, email: true } },
                assignedBy: { select: { id: true, username: true } },
            },
        });
        await prisma.notification.create({
            data: {
                type: 'ASSIGNMENT_CREATED',
                channel: 'EMAIL',
                subject: `Vulnerability Assigned: ${vuln.vulnerabilityId}`,
                body: `You have been assigned vulnerability ${vuln.vulnerabilityId} (${vuln.severity}) with deadline ${slaDeadline.toISOString()}`,
                metadata: { assignmentId: assignment.id, vulnerabilityId: vuln.vulnerabilityId },
                userId: dto.assignedToId,
            },
        });
        await audit_service_1.auditService.record({
            action: 'VULNERABILITY_ASSIGNED',
            entity: 'Vulnerability',
            entityId: vuln.vulnerabilityId,
            description: `Assigned ${vuln.vulnerabilityId} to ${assignedTo.username} with SLA ${slaDeadline.toISOString()}`,
            userId: assignedById,
        });
        return this.mapResponse(assignment);
    }
    async findAll(filters) {
        const prisma = (0, prisma_1.getPrisma)();
        const { status, assigneeId, breached, page = 1, limit = 20 } = filters;
        const where = {};
        if (status)
            where.status = status;
        if (assigneeId)
            where.assignedToId = assigneeId;
        if (breached)
            where.slaBreached = true;
        const [items, total] = await Promise.all([
            prisma.vulnerabilityAssignment.findMany({
                where,
                include: {
                    vulnerability: true,
                    assignedTo: { select: { id: true, username: true, email: true } },
                    assignedBy: { select: { id: true, username: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.vulnerabilityAssignment.count({ where }),
        ]);
        return { items: items.map((a) => this.mapResponse(a)), total };
    }
    async findById(id) {
        const prisma = (0, prisma_1.getPrisma)();
        const assignment = await prisma.vulnerabilityAssignment.findUnique({
            where: { id },
            include: {
                vulnerability: { include: { scan: { include: { image: true } } } },
                assignedTo: { select: { id: true, username: true, email: true } },
                assignedBy: { select: { id: true, username: true } },
            },
        });
        if (!assignment)
            throw new errors_1.NotFoundError('Assignment', id);
        return this.mapResponse(assignment);
    }
    async updateStatus(id, dto, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const assignment = await prisma.vulnerabilityAssignment.findUnique({ where: { id } });
        if (!assignment)
            throw new errors_1.NotFoundError('Assignment', id);
        const data = { status: dto.status };
        if (dto.status === 'RESOLVED') {
            data.resolvedAt = new Date();
        }
        const updated = await prisma.vulnerabilityAssignment.update({
            where: { id },
            data,
            include: {
                vulnerability: true,
                assignedTo: { select: { id: true, username: true, email: true } },
                assignedBy: { select: { id: true, username: true } },
            },
        });
        await audit_service_1.auditService.record({
            action: 'ASSIGNMENT_STATUS_UPDATED',
            entity: 'VulnerabilityAssignment',
            entityId: id,
            description: `Assignment status changed to ${dto.status}`,
            userId,
        });
        return this.mapResponse(updated);
    }
    async processSlaBreaches() {
        const prisma = (0, prisma_1.getPrisma)();
        const now = new Date();
        const breached = await prisma.vulnerabilityAssignment.findMany({
            where: {
                status: { in: ['OPEN', 'IN_PROGRESS'] },
                slaDeadline: { lt: now },
                slaBreached: false,
            },
        });
        for (const a of breached) {
            await prisma.vulnerabilityAssignment.update({
                where: { id: a.id },
                data: { slaBreached: true, slaBreachedAt: now },
            });
            await prisma.notification.create({
                data: {
                    type: 'SLA_BREACHED',
                    channel: 'EMAIL',
                    subject: 'SLA Breached',
                    body: `SLA breached for assignment ${a.id}`,
                    metadata: { assignmentId: a.id, slaDeadline: a.slaDeadline },
                    userId: a.assignedToId,
                },
            });
        }
        return breached.length;
    }
    async autoResolveByScan(scanId) {
        const prisma = (0, prisma_1.getPrisma)();
        const scan = await prisma.scan.findUnique({ where: { id: scanId } });
        if (!scan)
            return 0;
        const scanVulnIds = await prisma.vulnerability.findMany({
            where: { scanId },
            select: { vulnerabilityId: true },
        });
        const scanCveSet = new Set(scanVulnIds.map((v) => v.vulnerabilityId));
        const assignments = await prisma.vulnerabilityAssignment.findMany({
            where: {
                vulnerability: { scan: { imageId: scan.imageId } },
                status: { in: ['OPEN', 'IN_PROGRESS', 'ACCEPTED_RISK'] },
            },
            include: { vulnerability: true },
        });
        let resolved = 0;
        for (const a of assignments) {
            if (!scanCveSet.has(a.vulnerability.vulnerabilityId)) {
                await prisma.vulnerabilityAssignment.update({
                    where: { id: a.id },
                    data: { status: 'RESOLVED', resolvedAt: new Date(), resolvingScanId: scanId },
                });
                resolved++;
            }
        }
        return resolved;
    }
    async getComplianceReport(dateFrom, dateTo) {
        const prisma = (0, prisma_1.getPrisma)();
        const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const to = dateTo ? new Date(dateTo) : new Date();
        const assignments = await prisma.vulnerabilityAssignment.findMany({
            where: { createdAt: { gte: from, lte: to } },
            orderBy: { createdAt: 'asc' },
        });
        const totalAssignments = assignments.length;
        const breachedCount = assignments.filter((a) => a.slaBreached).length;
        const acceptedRiskCount = assignments.filter((a) => a.status === 'ACCEPTED_RISK').length;
        const falsePositiveCount = assignments.filter((a) => a.status === 'FALSE_POSITIVE').length;
        const resolvedWithTime = assignments
            .filter((a) => a.status === 'RESOLVED' && a.resolvedAt)
            .map((a) => a.resolvedAt.getTime() - a.createdAt.getTime());
        const mttrSeconds = resolvedWithTime.length > 0
            ? Math.round(resolvedWithTime.reduce((a, b) => a + b, 0) / resolvedWithTime.length / 1000)
            : 0;
        const byStatus = {};
        for (const a of assignments) {
            byStatus[a.status] = (byStatus[a.status] || 0) + 1;
        }
        const now = Date.now();
        const agingBuckets = {};
        for (const a of assignments.filter((a) => ['OPEN', 'IN_PROGRESS'].includes(a.status))) {
            const days = Math.floor((now - a.createdAt.getTime()) / (24 * 60 * 60 * 1000));
            const bucket = Math.floor(days / 7) * 7;
            agingBuckets[bucket] = (agingBuckets[bucket] || 0) + 1;
        }
        const agingVulnerabilities = Object.entries(agingBuckets).map(([days, count]) => ({ days: parseInt(days), count }));
        return { totalAssignments, breachedCount, mttrSeconds, acceptedRiskCount, falsePositiveCount, agingVulnerabilities, byStatus };
    }
    mapResponse(a) {
        return {
            id: a.id,
            vulnerabilityId: a.vulnerabilityId,
            cveId: a.vulnerability?.vulnerabilityId || '',
            severity: a.vulnerability?.severity || '',
            assignedTo: a.assignedTo,
            assignedBy: a.assignedBy,
            status: a.status,
            slaDeadline: a.slaDeadline?.toISOString() || '',
            slaBreached: a.slaBreached,
            slaBreachedAt: a.slaBreachedAt?.toISOString() || null,
            resolvedAt: a.resolvedAt?.toISOString() || null,
            resolvingScanId: a.resolvingScanId || null,
            notes: a.notes,
            createdAt: a.createdAt?.toISOString() || '',
            updatedAt: a.updatedAt?.toISOString() || '',
        };
    }
}
exports.AssignmentService = AssignmentService;
exports.assignmentService = new AssignmentService();
//# sourceMappingURL=assignment.service.js.map