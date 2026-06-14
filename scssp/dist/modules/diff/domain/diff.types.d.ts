export interface DiffSummary {
    introduced: number;
    resolved: number;
    persisted: number;
    deltaScore: number;
    regressionDetected: boolean;
}
export interface DiffResponse {
    scanId: string;
    baselineScanId: string;
    summary: DiffSummary;
    introduced: DiffVulnerability[];
    resolved: DiffVulnerability[];
    persisted: DiffVulnerability[];
}
export interface DiffVulnerability {
    id: string;
    vulnerabilityId: string;
    severity: string;
    packageName?: string;
    pkgName?: string;
    fixedVersion?: string;
    title?: string;
}
//# sourceMappingURL=diff.types.d.ts.map