import type { DiffResponse } from '../domain/diff.types';
export declare class DiffService {
    getDiffForScan(scanId: string): Promise<DiffResponse>;
    getManualDiff(scanAId: string, scanBId: string): Promise<DiffResponse>;
    computeAndStoreDiff(scanId: string): Promise<void>;
    private buildDiffResponse;
}
export declare const diffService: DiffService;
//# sourceMappingURL=diff.service.d.ts.map