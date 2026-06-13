import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockClient = {
  bucketExists: vi.fn(),
  makeBucket: vi.fn(),
  putObject: vi.fn(),
  getObject: vi.fn(),
  removeObject: vi.fn(),
  presignedGetObject: vi.fn(),
};

vi.mock('minio', () => ({
  Client: vi.fn(() => mockClient),
}));

vi.mock('@shared/config/env', () => ({
  getEnv: () => ({
    MINIO_ENDPOINT: 'localhost',
    MINIO_PORT: 9000,
    MINIO_ACCESS_KEY: 'test',
    MINIO_SECRET_KEY: 'test',
    MINIO_BUCKET: 'test-bucket',
    MINIO_USE_SSL: false,
    MINIO_REGION: 'us-east-1',
    LOG_LEVEL: 'error',
  }),
}));

vi.mock('@shared/utils/logger', () => ({
  getLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
}));

import { ensureBucket, uploadFile, getFileUrl, downloadFile, deleteFile } from '@shared/storage/minio';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MinIO Storage Helpers', () => {
  describe('ensureBucket', () => {
    it('should not create bucket if it already exists', async () => {
      mockClient.bucketExists.mockResolvedValue(true);

      await ensureBucket();

      expect(mockClient.bucketExists).toHaveBeenCalledWith('test-bucket');
      expect(mockClient.makeBucket).not.toHaveBeenCalled();
    });

    it('should create bucket if it does not exist', async () => {
      mockClient.bucketExists.mockResolvedValue(false);

      await ensureBucket();

      expect(mockClient.bucketExists).toHaveBeenCalledWith('test-bucket');
      expect(mockClient.makeBucket).toHaveBeenCalledWith('test-bucket', 'us-east-1');
    });
  });

  describe('uploadFile', () => {
    it('should upload a buffer', async () => {
      const buffer = Buffer.from('test data');
      const result = await uploadFile('test.txt', buffer, buffer.length, 'text/plain');

      expect(mockClient.putObject).toHaveBeenCalledWith(
        'test-bucket',
        'test.txt',
        buffer,
        buffer.length,
        { 'Content-Type': 'text/plain' },
      );
      expect(result).toBe('test.txt');
    });

    it('should upload without content type', async () => {
      const buffer = Buffer.from('test');
      await uploadFile('test.bin', buffer, buffer.length);

      expect(mockClient.putObject).toHaveBeenCalledWith(
        'test-bucket',
        'test.bin',
        buffer,
        buffer.length,
        {},
      );
    });
  });

  describe('getFileUrl', () => {
    it('should return a presigned URL', async () => {
      mockClient.presignedGetObject.mockResolvedValue('https://minio/test-bucket/test.txt?signature=abc');

      const url = await getFileUrl('test.txt');

      expect(mockClient.presignedGetObject).toHaveBeenCalledWith('test-bucket', 'test.txt', 86400);
      expect(url).toBe('https://minio/test-bucket/test.txt?signature=abc');
    });
  });

  describe('downloadFile', () => {
    it('should download file as buffer', async () => {
      const stream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('chunk1');
          yield Buffer.from('chunk2');
        },
      };
      mockClient.getObject.mockResolvedValue(stream);

      const result = await downloadFile('test.txt');

      expect(mockClient.getObject).toHaveBeenCalledWith('test-bucket', 'test.txt');
      expect(result.toString()).toBe('chunk1chunk2');
    });
  });

  describe('deleteFile', () => {
    it('should delete an object', async () => {
      await deleteFile('test.txt');

      expect(mockClient.removeObject).toHaveBeenCalledWith('test-bucket', 'test.txt');
    });
  });
});
