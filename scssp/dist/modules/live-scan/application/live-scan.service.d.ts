import type { CreateLiveScanDto, LiveScanResponse } from '../domain/live-scan.types';
export declare class LiveScanService {
    create(dto: CreateLiveScanDto, userId: string): Promise<LiveScanResponse>;
    findById(id: string): Promise<LiveScanResponse>;
    findByDigest(digest: string, userId: string): Promise<LiveScanResponse | null>;
    updateProgress(liveScanId: string, progress: number, status?: string): Promise<void>;
    complete(liveScanId: string, passed: boolean, blockingReason?: string, downloadUrl?: string): Promise<void>;
    fail(liveScanId: string, error: string): Promise<void>;
    private mapResponse;
}
export declare const liveScanService: LiveScanService;
//# sourceMappingURL=live-scan.service.d.ts.map