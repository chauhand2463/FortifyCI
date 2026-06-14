import type { CreateExceptionDto, ExceptionResponse } from '../domain/exception.types';
export declare class ExceptionService {
    create(dto: CreateExceptionDto, userId: string): Promise<ExceptionResponse>;
    findAll(filters: {
        isActive?: boolean;
        cveId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: ExceptionResponse[];
        total: number;
    }>;
    findById(id: string): Promise<ExceptionResponse>;
    approve(id: string, userId: string): Promise<ExceptionResponse>;
    revoke(id: string, userId: string): Promise<ExceptionResponse>;
    processExpiredExceptions(): Promise<number>;
    private mapResponse;
}
export declare const exceptionService: ExceptionService;
//# sourceMappingURL=exception.service.d.ts.map