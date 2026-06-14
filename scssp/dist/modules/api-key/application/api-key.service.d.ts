import type { CreateApiKeyDto, ApiKeyQueryDto, ApiKeyResponse, PaginatedApiKeys } from '../domain/api-key.types';
export declare class ApiKeyService {
    create(dto: CreateApiKeyDto, userId: string): Promise<ApiKeyResponse & {
        key: string;
    }>;
    findAll(query: ApiKeyQueryDto, userId: string): Promise<PaginatedApiKeys>;
    delete(id: string, userId: string): Promise<void>;
    private mapResponse;
}
export declare const apiKeyService: ApiKeyService;
//# sourceMappingURL=api-key.service.d.ts.map