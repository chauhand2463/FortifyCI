import type { CreateSbomDto, SbomQueryDto, SbomResponse, PaginatedSboms, PackageSearchResult } from '../domain/sbom.types';
export declare class SbomService {
    generate(dto: CreateSbomDto, userId: string): Promise<SbomResponse>;
    findAll(query: SbomQueryDto): Promise<PaginatedSboms>;
    findById(id: string): Promise<SbomResponse>;
    delete(id: string, userId: string): Promise<void>;
    searchPackages(query: string, page?: number, limit?: number): Promise<{
        items: PackageSearchResult[];
        total: number;
        page: number;
        limit: number;
    }>;
    private mapSbomResponse;
}
export declare const sbomService: SbomService;
//# sourceMappingURL=sbom.service.d.ts.map