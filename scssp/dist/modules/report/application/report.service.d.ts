import type { CreateReportDto, ReportQueryDto, ReportResponse, PaginatedReports } from '../domain/report.types';
export declare class ReportService {
    create(dto: CreateReportDto, userId: string): Promise<ReportResponse>;
    findAll(query: ReportQueryDto): Promise<PaginatedReports>;
    findById(id: string): Promise<ReportResponse>;
    delete(id: string, userId: string): Promise<void>;
    private mapReportResponse;
}
export declare const reportService: ReportService;
//# sourceMappingURL=report.service.d.ts.map