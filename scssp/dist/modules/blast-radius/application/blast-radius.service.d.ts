import type { BlastRadiusResponse } from '../domain/blast-radius.types';
export declare class BlastRadiusService {
    findByCve(cveId: string): Promise<BlastRadiusResponse>;
    findByPackage(packageName: string): Promise<BlastRadiusResponse>;
    bulkRescan(cveId: string, userId: string): Promise<{
        scansCreated: number;
    }>;
}
export declare const blastRadiusService: BlastRadiusService;
//# sourceMappingURL=blast-radius.service.d.ts.map