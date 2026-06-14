"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMinioClient = getMinioClient;
exports.ensureBucket = ensureBucket;
exports.uploadFile = uploadFile;
exports.getFileUrl = getFileUrl;
exports.downloadFile = downloadFile;
exports.deleteFile = deleteFile;
const minio_1 = require("minio");
const env_1 = require("@shared/config/env");
const logger_1 = require("@shared/utils/logger");
const logger = (0, logger_1.getLogger)();
let _minioClient = null;
function getMinioClient() {
    if (!_minioClient) {
        const env = (0, env_1.getEnv)();
        _minioClient = new minio_1.Client({
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
async function ensureBucket() {
    const env = (0, env_1.getEnv)();
    const client = getMinioClient();
    const bucket = env.MINIO_BUCKET;
    const exists = await client.bucketExists(bucket);
    if (!exists) {
        await client.makeBucket(bucket, env.MINIO_REGION);
        logger.info({ bucket }, 'MinIO bucket created');
    }
}
async function uploadFile(objectName, stream, size, contentType) {
    const env = (0, env_1.getEnv)();
    const client = getMinioClient();
    const bucket = env.MINIO_BUCKET;
    const meta = {};
    if (contentType)
        meta['Content-Type'] = contentType;
    await client.putObject(bucket, objectName, stream, size, meta);
    logger.info({ bucket, objectName }, 'File uploaded to MinIO');
    return objectName;
}
async function getFileUrl(objectName) {
    const env = (0, env_1.getEnv)();
    const client = getMinioClient();
    const bucket = env.MINIO_BUCKET;
    return await client.presignedGetObject(bucket, objectName, 24 * 60 * 60);
}
async function downloadFile(objectName) {
    const env = (0, env_1.getEnv)();
    const client = getMinioClient();
    const bucket = env.MINIO_BUCKET;
    const stream = await client.getObject(bucket, objectName);
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}
async function deleteFile(objectName) {
    const env = (0, env_1.getEnv)();
    const client = getMinioClient();
    const bucket = env.MINIO_BUCKET;
    await client.removeObject(bucket, objectName);
    logger.info({ bucket, objectName }, 'File deleted from MinIO');
}
//# sourceMappingURL=minio.js.map