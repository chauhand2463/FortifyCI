import { getPrisma } from '@shared/database/prisma';
import { auditService } from '@modules/audit/application/audit.service';
import { getQueue } from '@shared/queue';
import type { BlastRadiusResponse, AffectedImage } from '../domain/blast-radius.types';

export class BlastRadiusService {
  async findByCve(cveId: string): Promise<BlastRadiusResponse> {
    const prisma = getPrisma();

    const vulns = await prisma.vulnerability.findMany({
      where: { vulnerabilityId: cveId },
      include: {
        scan: {
          include: { image: true },
        },
      },
    });

    const completedVulns = vulns.filter((v) => v.scan?.status === 'COMPLETED' && !v.scan.image.deletedAt);

    const imageMap = new Map<string, AffectedImage>();
    for (const v of completedVulns) {
      const scan = v.scan;
      const image = scan.image;
      const key = image.id;
      if (!imageMap.has(key)) {
        imageMap.set(key, {
          imageId: image.id,
          imageRef: `${image.registry}/${image.repository}:${image.tag}`,
          severity: v.severity,
          pkgName: v.pkgName || v.packageName,
          installedVersion: v.pkgVersion || v.packageVersion,
          fixedVersion: v.fixedVersion,
          lastScanId: scan.id,
          lastScannedAt: scan.completedAt?.toISOString() || '',
          isStale: scan.completedAt ? (Date.now() - scan.completedAt.getTime()) > 7 * 24 * 60 * 60 * 1000 : true,
        });
      }
    }

    const affectedImages = Array.from(imageMap.values());
    const fleetSize = await prisma.image.count({ where: { deletedAt: null } });
    const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
    let fixableImages = 0;

    for (const img of affectedImages) {
      const key = img.severity.toLowerCase() as keyof typeof breakdown;
      if (key in breakdown) breakdown[key]++;
      if (img.fixedVersion) fixableImages++;
    }

    return {
      cveId,
      totalAffected: affectedImages.length,
      fleetSize,
      fleetPercentage: fleetSize ? parseFloat(((affectedImages.length / fleetSize) * 100).toFixed(1)) : 0,
      breakdown,
      fixableImages,
      affectedImages,
    };
  }

  async findByPackage(packageName: string): Promise<BlastRadiusResponse> {
    const prisma = getPrisma();

    const vulns = await prisma.vulnerability.findMany({
      where: {
        OR: [
          { pkgName: { contains: packageName, mode: 'insensitive' } },
          { packageName: { contains: packageName, mode: 'insensitive' } },
        ],
      },
      include: {
        scan: {
          include: { image: true },
        },
      },
      take: 1000,
    });

    const completedVulns = vulns.filter((v) => v.scan?.status === 'COMPLETED' && !v.scan.image.deletedAt);

    const imageMap = new Map<string, AffectedImage>();
    for (const v of completedVulns) {
      const scan = v.scan;
      const image = scan.image;
      const key = image.id;
      if (!imageMap.has(key)) {
        imageMap.set(key, {
          imageId: image.id,
          imageRef: `${image.registry}/${image.repository}:${image.tag}`,
          severity: v.severity,
          pkgName: v.pkgName || v.packageName,
          installedVersion: v.pkgVersion || v.packageVersion,
          fixedVersion: v.fixedVersion,
          lastScanId: scan.id,
          lastScannedAt: scan.completedAt?.toISOString() || '',
          isStale: scan.completedAt ? (Date.now() - scan.completedAt.getTime()) > 7 * 24 * 60 * 60 * 1000 : true,
        });
      }
    }

    const affectedImages = Array.from(imageMap.values());
    const fleetSize = await prisma.image.count({ where: { deletedAt: null } });
    const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
    let fixableImages = 0;

    for (const img of affectedImages) {
      const key = img.severity.toLowerCase() as keyof typeof breakdown;
      if (key in breakdown) breakdown[key]++;
      if (img.fixedVersion) fixableImages++;
    }

    return {
      cveId: packageName,
      totalAffected: affectedImages.length,
      fleetSize,
      fleetPercentage: fleetSize ? parseFloat(((affectedImages.length / fleetSize) * 100).toFixed(1)) : 0,
      breakdown,
      fixableImages,
      affectedImages,
    };
  }

  async bulkRescan(cveId: string, userId: string): Promise<{ scansCreated: number }> {
    const prisma = getPrisma();
    const queue = getQueue('scan');

    const vulns = await prisma.vulnerability.findMany({
      where: { vulnerabilityId: cveId },
      include: {
        scan: { include: { image: true } },
      },
    });

    const completedVulns = vulns.filter((v) => v.scan?.status === 'COMPLETED' && !v.scan.image.deletedAt);
    const imageIds = [...new Set(completedVulns.map((v) => v.scan.imageId))];
    let scansCreated = 0;

    for (const imageId of imageIds) {
      const image = await prisma.image.findUnique({ where: { id: imageId } });
      if (!image) continue;

      const scan = await prisma.scan.create({
        data: {
          imageId: image.id,
          imageRef: `${image.registry}/${image.repository}:${image.tag}`,
          scanType: 'trivy',
          triggeredBy: 'BLAST_RADIUS_RESCAN',
          userId,
        },
      });

      await queue.add('scan-image', { scanId: scan.id, imageId: image.id }, {
        attempts: 4,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      });

      await prisma.scan.update({
        where: { id: scan.id },
        data: { status: 'QUEUED' },
      });

      scansCreated++;
    }

    await auditService.record({
      action: 'BLAST_RADIUS_RESCAN',
      entity: 'Scan',
      entityId: cveId,
      description: `Bulk rescan triggered for CVE ${cveId}: ${scansCreated} images queued`,
      userId,
    });

    return { scansCreated };
  }
}

export const blastRadiusService = new BlastRadiusService();
