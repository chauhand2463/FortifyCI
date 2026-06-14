export interface TrivyResult {
    vulnerabilities: TrivyVulnerability[];
    scanTime: number;
    target: string;
}
export interface TrivyVulnerability {
    vulnerabilityId: string;
    pkgName: string;
    installedVersion: string;
    fixedVersion: string | null;
    severity: string;
    title: string | null;
    description: string | null;
    publishedDate: string | null;
    lastModifiedDate: string | null;
    cvssScore: number | null;
    cvssVector: string | null;
    cweIds: string[] | null;
    referenceUrls: string[] | null;
    exploitAvailable: boolean | null;
    epssScore: number | null;
    layerInfo: Record<string, unknown> | null;
    pkgType: string | null;
}
export interface RegistryCredential {
    username: string;
    password: string;
    serverAddress?: string;
}
export declare function cancelScanProcess(scanId: string): boolean;
export declare function getActiveScanIds(): string[];
export declare function getActiveScanCount(): number;
export declare function scanImage(imageRef: string, credentials?: RegistryCredential | null, scanId?: string): Promise<TrivyResult>;
//# sourceMappingURL=trivy.d.ts.map