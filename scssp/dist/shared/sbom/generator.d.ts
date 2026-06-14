import type { RegistryCredential } from '@shared/scanner/trivy';
export interface SbomPackage {
    name: string;
    version: string;
    ecosystem: string;
    purl?: string;
}
export declare function generateTrivySbom(imageRef: string, format?: 'cyclonedx' | 'spdx', credentials?: RegistryCredential | null): Promise<string>;
export declare function extractPackagesFromSbom(sbomJson: any): SbomPackage[];
export declare function generateSpdxSbom(imageId: string): Promise<{
    content: Record<string, unknown>;
    packageCount: number;
    version: string;
}>;
export declare function generateCycloneDxSbom(imageId: string): Promise<{
    content: Record<string, unknown>;
    packageCount: number;
    version: string;
}>;
//# sourceMappingURL=generator.d.ts.map