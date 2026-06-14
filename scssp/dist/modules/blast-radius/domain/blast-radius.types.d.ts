export interface BlastRadiusQuery {
    cveId?: string;
    packageName?: string;
}
export interface BlastRadiusResponse {
    cveId: string;
    totalAffected: number;
    fleetSize: number;
    fleetPercentage: number;
    breakdown: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    fixableImages: number;
    affectedImages: AffectedImage[];
}
export interface AffectedImage {
    imageId: string;
    imageRef: string;
    severity: string;
    pkgName?: string;
    installedVersion?: string;
    fixedVersion?: string;
    lastScanId: string;
    lastScannedAt: string;
    isStale: boolean;
}
//# sourceMappingURL=blast-radius.types.d.ts.map