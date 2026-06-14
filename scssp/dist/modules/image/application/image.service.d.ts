import type { RegisterImageDto, ImageQueryDto, ImageResponse, PaginatedImages } from '../domain/image.types';
export declare class ImageService {
    register(dto: RegisterImageDto, userId: string): Promise<ImageResponse>;
    findAll(query: ImageQueryDto): Promise<PaginatedImages>;
    findById(id: string): Promise<ImageResponse>;
    delete(id: string, userId: string): Promise<void>;
    private mapImageResponse;
}
export declare const imageService: ImageService;
//# sourceMappingURL=image.service.d.ts.map