import type { NvdWatchStatus, CveWatchResponse } from '../domain/nvd.types';
export declare class NvdService {
    getStatus(): Promise<NvdWatchStatus>;
    getRecent(filters: {
        processed?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        items: CveWatchResponse[];
        total: number;
    }>;
    sync(): Promise<void>;
    private findAffectedImages;
}
export declare const nvdService: NvdService;
//# sourceMappingURL=nvd.service.d.ts.map