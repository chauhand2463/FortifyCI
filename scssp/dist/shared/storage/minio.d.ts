import { Client } from 'minio';
import { Readable } from 'stream';
export declare function getMinioClient(): Client;
export declare function ensureBucket(): Promise<void>;
export declare function uploadFile(objectName: string, stream: Buffer | Readable, size: number, contentType?: string): Promise<string>;
export declare function getFileUrl(objectName: string): Promise<string>;
export declare function downloadFile(objectName: string): Promise<Buffer>;
export declare function deleteFile(objectName: string): Promise<void>;
//# sourceMappingURL=minio.d.ts.map