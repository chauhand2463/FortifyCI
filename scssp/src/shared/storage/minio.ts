import { Client } from 'minio';
import { getEnv } from '@shared/config/env';
import { getLogger } from '@shared/utils/logger';
import { Readable } from 'stream';

const logger = getLogger();

let _minioClient: Client | null = null;

export function getMinioClient(): Client {
  if (!_minioClient) {
    const env = getEnv();
    _minioClient = new Client({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
      region: env.MINIO_REGION,
    });
  }
  return _minioClient;
}

export async function ensureBucket(): Promise<void> {
  const env = getEnv();
  const client = getMinioClient();
  const bucket = env.MINIO_BUCKET;

  const exists = await client.bucketExists(bucket);
  if (!exists) {
    await client.makeBucket(bucket, env.MINIO_REGION);
    logger.info({ bucket }, 'MinIO bucket created');
  }
}

export async function uploadFile(
  objectName: string,
  stream: Buffer | Readable,
  size: number,
  contentType?: string,
): Promise<string> {
  const env = getEnv();
  const client = getMinioClient();
  const bucket = env.MINIO_BUCKET;

  const meta: Record<string, string> = {};
  if (contentType) meta['Content-Type'] = contentType;

  await client.putObject(bucket, objectName, stream, size, meta);
  logger.info({ bucket, objectName }, 'File uploaded to MinIO');

  return objectName;
}

export async function getFileUrl(objectName: string): Promise<string> {
  const env = getEnv();
  const client = getMinioClient();
  const bucket = env.MINIO_BUCKET;

  return await client.presignedGetObject(bucket, objectName, 24 * 60 * 60);
}

export async function downloadFile(objectName: string): Promise<Buffer> {
  const env = getEnv();
  const client = getMinioClient();
  const bucket = env.MINIO_BUCKET;

  const stream = await client.getObject(bucket, objectName);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function deleteFile(objectName: string): Promise<void> {
  const env = getEnv();
  const client = getMinioClient();
  const bucket = env.MINIO_BUCKET;

  await client.removeObject(bucket, objectName);
  logger.info({ bucket, objectName }, 'File deleted from MinIO');
}
