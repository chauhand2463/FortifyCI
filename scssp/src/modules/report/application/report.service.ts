import { getPrisma } from '@shared/database/prisma';
import { auditService } from '@modules/audit/application/audit.service';
import { NotFoundError } from '@shared/errors';
import { getQueue } from '@shared/queue';
import type { CreateReportDto, ReportQueryDto, ReportResponse, PaginatedReports } from '../domain/report.types';

export class ReportService {
  async create(dto: CreateReportDto, userId: string): Promise<ReportResponse> {
    const prisma = getPrisma();

    const report = await prisma.report.create({
      data: {
        title: dto.title,
        format: dto.format as any,
        parameters: dto.parameters ? JSON.parse(JSON.stringify(dto.parameters)) : undefined,
        scanId: dto.scanId,
        imageId: dto.imageId,
        userId,
      },
    });

    const queue = getQueue('report');
    await queue.add('generate-report', { reportId: report.id, format: dto.format }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    await auditService.record({
      action: 'REPORT_CREATED',
      entity: 'Report',
      entityId: report.id,
      description: `Report queued: ${dto.title} (${dto.format})`,
      userId,
    });

    return this.mapReportResponse(report);
  }

  async findAll(query: ReportQueryDto): Promise<PaginatedReports> {
    const prisma = getPrisma();
    const { page, limit, format, status } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (format) where.format = format;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.report.count({ where }),
    ]);

    return {
      items: items.map((r) => this.mapReportResponse(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<ReportResponse> {
    const prisma = getPrisma();
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundError('Report', id);
    return this.mapReportResponse(report);
  }

  async delete(id: string, userId: string): Promise<void> {
    const prisma = getPrisma();
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundError('Report', id);

    await prisma.report.delete({ where: { id } });

    await auditService.record({
      action: 'REPORT_DELETED',
      entity: 'Report',
      entityId: id,
      description: `Report deleted: ${report.title}`,
      userId,
    });
  }

  private mapReportResponse(report: any): ReportResponse {
    return {
      id: report.id,
      title: report.title,
      format: report.format,
      status: report.status,
      parameters: report.parameters,
      filePath: report.filePath,
      fileSize: report.fileSize,
      generatedAt: report.generatedAt,
      scanId: report.scanId,
      imageId: report.imageId,
      userId: report.userId,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }
}

export const reportService = new ReportService();
