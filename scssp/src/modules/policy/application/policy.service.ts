import { getPrisma } from '@shared/database/prisma';
import { auditService } from '@modules/audit/application/audit.service';
import { NotFoundError, ValidationError } from '@shared/errors';
import type { CreatePolicyDto, PolicyResponse, PolicyEvaluationResult } from '../domain/policy.types';

export class PolicyService {
  async create(dto: CreatePolicyDto, userId: string): Promise<PolicyResponse> {
    const prisma = getPrisma();

    const existing = await prisma.scanPolicy.findUnique({ where: { name: dto.name } });
    if (existing) throw new ValidationError(`Policy "${dto.name}" already exists`);

    const policy = await prisma.scanPolicy.create({
      data: {
        name: dto.name,
        description: dto.description,
        blockOnCritical: dto.blockOnCritical ?? true,
        blockOnHigh: dto.blockOnHigh ?? false,
        blockOnlyFixable: dto.blockOnlyFixable ?? true,
        maxHighCount: dto.maxHighCount ?? 0,
        maxMediumCount: dto.maxMediumCount ?? -1,
        slaCriticalDays: dto.slaCriticalDays ?? 7,
        slaHighDays: dto.slaHighDays ?? 30,
        slaMediumDays: dto.slaMediumDays ?? 90,
        registryPatterns: dto.registryPatterns ?? ['*'],
        isDefault: dto.isDefault ?? false,
      },
    });

    if (policy.isDefault) {
      await prisma.scanPolicy.updateMany({
        where: { id: { not: policy.id }, isDefault: true },
        data: { isDefault: false },
      });
    }

    await auditService.record({
      action: 'POLICY_CREATED',
      entity: 'ScanPolicy',
      entityId: policy.id,
      description: `Policy created: ${dto.name}`,
      userId,
    });

    return this.mapResponse(policy);
  }

  async findAll(): Promise<PolicyResponse[]> {
    const prisma = getPrisma();
    const policies = await prisma.scanPolicy.findMany({ orderBy: { createdAt: 'desc' } });
    return policies.map((p) => this.mapResponse(p));
  }

  async findById(id: string): Promise<PolicyResponse> {
    const prisma = getPrisma();
    const policy = await prisma.scanPolicy.findUnique({ where: { id } });
    if (!policy) throw new NotFoundError('Policy', id);
    return this.mapResponse(policy);
  }

  async update(id: string, dto: Partial<CreatePolicyDto>, userId: string): Promise<PolicyResponse> {
    const prisma = getPrisma();
    const existing = await prisma.scanPolicy.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Policy', id);

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.blockOnCritical !== undefined) data.blockOnCritical = dto.blockOnCritical;
    if (dto.blockOnHigh !== undefined) data.blockOnHigh = dto.blockOnHigh;
    if (dto.blockOnlyFixable !== undefined) data.blockOnlyFixable = dto.blockOnlyFixable;
    if (dto.maxHighCount !== undefined) data.maxHighCount = dto.maxHighCount;
    if (dto.maxMediumCount !== undefined) data.maxMediumCount = dto.maxMediumCount;
    if (dto.slaCriticalDays !== undefined) data.slaCriticalDays = dto.slaCriticalDays;
    if (dto.slaHighDays !== undefined) data.slaHighDays = dto.slaHighDays;
    if (dto.slaMediumDays !== undefined) data.slaMediumDays = dto.slaMediumDays;
    if (dto.registryPatterns !== undefined) data.registryPatterns = dto.registryPatterns;

    if (dto.isDefault === true) {
      await prisma.scanPolicy.updateMany({
        where: { id: { not: id }, isDefault: true },
        data: { isDefault: false },
      });
      data.isDefault = true;
    }

    const policy = await prisma.scanPolicy.update({
      where: { id },
      data,
    });

    await auditService.record({
      action: 'POLICY_UPDATED',
      entity: 'ScanPolicy',
      entityId: id,
      description: `Policy updated: ${policy.name}`,
      userId,
    });

    return this.mapResponse(policy);
  }

  async delete(id: string, userId: string): Promise<void> {
    const prisma = getPrisma();
    const policy = await prisma.scanPolicy.findUnique({ where: { id } });
    if (!policy) throw new NotFoundError('Policy', id);
    if (policy.isDefault) throw new ValidationError('Cannot delete the default policy');

    await prisma.scanPolicy.delete({ where: { id } });

    await auditService.record({
      action: 'POLICY_DELETED',
      entity: 'ScanPolicy',
      entityId: id,
      description: `Policy deleted: ${policy.name}`,
      userId,
    });
  }

  async setDefault(id: string, userId: string): Promise<PolicyResponse> {
    const prisma = getPrisma();
    const policy = await prisma.scanPolicy.findUnique({ where: { id } });
    if (!policy) throw new NotFoundError('Policy', id);

    await prisma.scanPolicy.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    const updated = await prisma.scanPolicy.update({
      where: { id },
      data: { isDefault: true },
    });

    await auditService.record({
      action: 'POLICY_SET_DEFAULT',
      entity: 'ScanPolicy',
      entityId: id,
      description: `Policy set as default: ${policy.name}`,
      userId,
    });

    return this.mapResponse(updated);
  }

  async evaluate(imageId: string, policyId?: string): Promise<PolicyEvaluationResult> {
    const prisma = getPrisma();

    const lastScan = await prisma.scan.findFirst({
      where: { imageId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      include: { vulnerabilities: true },
    });

    if (!lastScan) return { passed: true, reason: 'No completed scan found', blockingCVEs: [], policyName: '' };

    const policy = policyId
      ? await prisma.scanPolicy.findUnique({ where: { id: policyId } })
      : await prisma.scanPolicy.findFirst({ where: { isDefault: true } });

    if (!policy) return { passed: true, reason: 'No policy configured', blockingCVEs: [], policyName: '' };

    const vulns = lastScan.vulnerabilities;
    const blocking: PolicyEvaluationResult['blockingCVEs'] = [];

    const activeExceptions = await prisma.vulnerabilityException.findMany({
      where: { isActive: true, expiresAt: { gt: new Date() } },
      select: { cveId: true, imageId: true },
    });
    const globalExceptionCves = new Set(activeExceptions.filter(e => !e.imageId).map(e => e.cveId));
    const imageExceptionCves = new Set(activeExceptions.filter(e => e.imageId === imageId).map(e => e.cveId));
    const exceptedCves = new Set([...globalExceptionCves, ...imageExceptionCves]);

    function isBlockable(v: typeof vulns[0]): boolean {
      if (exceptedCves.has(v.vulnerabilityId)) return false;
      if (policy.blockOnlyFixable) return !!v.fixedVersion;
      return true;
    }

    const criticalCount = vulns.filter((v) => v.severity === 'CRITICAL' && isBlockable(v)).length;
    const highCount = vulns.filter((v) => v.severity === 'HIGH' && isBlockable(v)).length;
    const mediumCount = vulns.filter((v) => v.severity === 'MEDIUM' && isBlockable(v)).length;

    if (policy.blockOnCritical && criticalCount > 0) {
      vulns.filter((v) => v.severity === 'CRITICAL' && isBlockable(v)).forEach((v) => {
        blocking.push({ vulnerabilityId: v.vulnerabilityId, severity: v.severity, pkgName: v.pkgName || v.packageName, fixedVersion: v.fixedVersion });
      });
    }

    if (policy.blockOnHigh) {
      const threshold = policy.maxHighCount >= 0 ? policy.maxHighCount : 0;
      if (highCount > threshold) {
        vulns.filter((v) => v.severity === 'HIGH' && isBlockable(v)).forEach((v) => {
          blocking.push({ vulnerabilityId: v.vulnerabilityId, severity: v.severity, pkgName: v.pkgName || v.packageName, fixedVersion: v.fixedVersion });
        });
      }
    }

    if (policy.maxMediumCount >= 0 && mediumCount > policy.maxMediumCount) {
      vulns.filter((v) => v.severity === 'MEDIUM' && isBlockable(v)).slice(0, policy.maxMediumCount === 0 ? mediumCount : 5).forEach((v) => {
        blocking.push({ vulnerabilityId: v.vulnerabilityId, severity: v.severity, pkgName: v.pkgName || v.packageName, fixedVersion: v.fixedVersion });
      });
    }

    const passed = blocking.length === 0;
    const reason = passed ? 'All checks passed' : `${blocking.length} blocking CVE(s) found`;

    return { passed, reason, blockingCVEs: blocking, policyName: policy.name };
  }

  async evaluateVulnerabilities(
    vulns: Array<{ vulnerabilityId: string; severity: string; pkgName?: string; packageName?: string; fixedVersion?: string | null }>,
    policyId?: string,
  ): Promise<PolicyEvaluationResult> {
    const prisma = getPrisma();

    const policy = policyId
      ? await prisma.scanPolicy.findUnique({ where: { id: policyId } })
      : await prisma.scanPolicy.findFirst({ where: { isDefault: true } });

    if (!policy) return { passed: true, reason: 'No policy configured', blockingCVEs: [], policyName: '' };

    const blocking: PolicyEvaluationResult['blockingCVEs'] = [];

    const activeExceptions = await prisma.vulnerabilityException.findMany({
      where: { isActive: true, expiresAt: { gt: new Date() } },
      select: { cveId: true },
    });
    const exceptedCves = new Set(activeExceptions.map(e => e.cveId));

    function isBlockable(v: (typeof vulns)[0]): boolean {
      if (exceptedCves.has(v.vulnerabilityId)) return false;
      if (policy.blockOnlyFixable) return !!v.fixedVersion;
      return true;
    }

    const criticalCount = vulns.filter(v => v.severity === 'CRITICAL' && isBlockable(v)).length;
    const highCount = vulns.filter(v => v.severity === 'HIGH' && isBlockable(v)).length;
    const mediumCount = vulns.filter(v => v.severity === 'MEDIUM' && isBlockable(v)).length;

    if (policy.blockOnCritical && criticalCount > 0) {
      vulns.filter(v => v.severity === 'CRITICAL' && isBlockable(v)).forEach(v => {
        blocking.push({ vulnerabilityId: v.vulnerabilityId, severity: v.severity, pkgName: v.pkgName || v.packageName, fixedVersion: v.fixedVersion ?? undefined });
      });
    }

    if (policy.blockOnHigh) {
      const threshold = policy.maxHighCount >= 0 ? policy.maxHighCount : 0;
      if (highCount > threshold) {
        vulns.filter(v => v.severity === 'HIGH' && isBlockable(v)).forEach(v => {
          blocking.push({ vulnerabilityId: v.vulnerabilityId, severity: v.severity, pkgName: v.pkgName || v.packageName, fixedVersion: v.fixedVersion ?? undefined });
        });
      }
    }

    if (policy.maxMediumCount >= 0 && mediumCount > policy.maxMediumCount) {
      vulns.filter(v => v.severity === 'MEDIUM' && isBlockable(v)).slice(0, policy.maxMediumCount === 0 ? mediumCount : 5).forEach(v => {
        blocking.push({ vulnerabilityId: v.vulnerabilityId, severity: v.severity, pkgName: v.pkgName || v.packageName, fixedVersion: v.fixedVersion ?? undefined });
      });
    }

    const passed = blocking.length === 0;
    const reason = passed ? 'All checks passed' : `${blocking.length} blocking CVE(s) found`;

    return { passed, reason, blockingCVEs: blocking, policyName: policy.name };
  }

  private mapResponse(p: any): PolicyResponse {
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      blockOnCritical: p.blockOnCritical,
      blockOnHigh: p.blockOnHigh,
      blockOnlyFixable: p.blockOnlyFixable ?? true,
      maxHighCount: p.maxHighCount,
      maxMediumCount: p.maxMediumCount,
      slaCriticalDays: p.slaCriticalDays,
      slaHighDays: p.slaHighDays,
      slaMediumDays: p.slaMediumDays,
      registryPatterns: p.registryPatterns,
      isDefault: p.isDefault,
      createdAt: p.createdAt?.toISOString() || '',
      updatedAt: p.updatedAt?.toISOString() || '',
    };
  }
}

export const policyService = new PolicyService();
