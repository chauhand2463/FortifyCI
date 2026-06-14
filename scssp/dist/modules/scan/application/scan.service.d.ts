import type { CreateScanDto, ScanQueryDto, ScanResponse, PaginatedScans } from '../domain/scan.types';
export declare class ScanService {
    create(dto: CreateScanDto, userId: string): Promise<ScanResponse>;
    findAll(query: ScanQueryDto): Promise<PaginatedScans>;
    findById(id: string): Promise<ScanResponse>;
    cancelScan(id: string, userId: string): Promise<void>;
    getSbom(scanId: string): Promise<any>;
    getPackages(scanId: string): Promise<any[]>;
    downloadSbom(scanId: string, format: string): Promise<{
        content: string;
        contentType: string;
        filename: string;
    }>;
    private mapScanResponse;
}
export declare const scanService: ScanService;
//# sourceMappingURL=scan.service.d.ts.map