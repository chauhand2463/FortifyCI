import type { CreateAssignmentDto, UpdateAssignmentStatusDto, AssignmentResponse, ComplianceReport } from '../domain/assignment.types';
export declare class AssignmentService {
    create(dto: CreateAssignmentDto, assignedById: string): Promise<AssignmentResponse>;
    findAll(filters: {
        status?: string;
        assigneeId?: string;
        breached?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        items: AssignmentResponse[];
        total: number;
    }>;
    findById(id: string): Promise<AssignmentResponse>;
    updateStatus(id: string, dto: UpdateAssignmentStatusDto, userId: string): Promise<AssignmentResponse>;
    processSlaBreaches(): Promise<number>;
    autoResolveByScan(scanId: string): Promise<number>;
    getComplianceReport(dateFrom?: string, dateTo?: string): Promise<ComplianceReport>;
    private mapResponse;
}
export declare const assignmentService: AssignmentService;
//# sourceMappingURL=assignment.service.d.ts.map