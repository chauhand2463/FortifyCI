import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('/api/v1'),

  DATABASE_URL: z.string(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),

  JWT_PRIVATE_KEY_PATH: z.string(),
  JWT_PUBLIC_KEY_PATH: z.string(),

  ENCRYPTION_KEY: z.string().min(32),
  ENCRYPTION_IV_LENGTH: z.coerce.number().default(16),

  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_BUCKET: z.string().default('fortifyci-images'),
  MINIO_USE_SSL: z.coerce.boolean().default(false),
  MINIO_REGION: z.string().default('us-east-1'),

  CORS_ORIGIN: z.string().default('*'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  SMTP_HOST: z.string().default('smtp.example.com'),
  SMTP_PORT: z.coerce.number().default(587),
  EMAIL_FROM: z.string().default('noreply@fortifyci.example.com'),

  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  TRIVY_BIN_PATH: z.string().default('trivy'),
  TRIVY_TIMEOUT: z.coerce.number().default(300000),
  TRIVY_CACHE_DIR: z.string().default('./.trivy-cache'),

  WORKER_CONCURRENCY: z.coerce.number().default(5),
  SCAN_TIMEOUT_MS: z.coerce.number().default(300000),

  PROMETHEUS_ENABLED: z.coerce.boolean().default(true),
  PROMETHEUS_METRICS_PATH: z.string().default('/metrics'),
});

const BASE_VARS: Record<string, string> = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  JWT_PRIVATE_KEY_PATH: './keys/private.pem',
  JWT_PUBLIC_KEY_PATH: './keys/public.pem',
  ENCRYPTION_KEY: 'a'.repeat(32),
  MINIO_ACCESS_KEY: 'minioadmin',
  MINIO_SECRET_KEY: 'minioadmin',
  LOG_LEVEL: 'error',
};

function parseEnv(overrides: Record<string, string | undefined> = {}): z.SafeParseReturnType<any, any> {
  const env: Record<string, string> = {};
  for (const key of Object.keys(BASE_VARS)) {
    env[key] = BASE_VARS[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }
  return envSchema.safeParse(env);
}

describe('Env Configuration', () => {
  it('should parse valid environment', () => {
    const result = parseEnv();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NODE_ENV).toBe('test');
      expect(result.data.PORT).toBe(3000);
      expect(result.data.ENCRYPTION_KEY).toBe('a'.repeat(32));
    }
  });

  it('should apply defaults for optional vars', () => {
    const result = parseEnv();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(3000);
      expect(result.data.HOST).toBe('0.0.0.0');
      expect(result.data.REDIS_HOST).toBe('localhost');
      expect(result.data.MINIO_PORT).toBe(9000);
      expect(result.data.MINIO_BUCKET).toBe('fortifyci-images');
      expect(result.data.CORS_ORIGIN).toBe('*');
    }
  });

  it('should fail when required var ENCRYPTION_KEY is missing', () => {
    const result = parseEnv({ ENCRYPTION_KEY: undefined });
    expect(result.success).toBe(false);
  });

  it('should fail when ENCRYPTION_KEY is too short', () => {
    const result = parseEnv({ ENCRYPTION_KEY: 'short' });
    expect(result.success).toBe(false);
  });

  it('should coerce PORT to number', () => {
    const result = parseEnv({ PORT: '4000' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(4000);
      expect(typeof result.data.PORT).toBe('number');
    }
  });

  it('should coerce boolean values', () => {
    const result = parseEnv({ MINIO_USE_SSL: 'true' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.MINIO_USE_SSL).toBe(true);
    }
  });

  it('should fail on invalid NODE_ENV', () => {
    const result = parseEnv({ NODE_ENV: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('should fail on invalid LOG_LEVEL', () => {
    const result = parseEnv({ LOG_LEVEL: 'silent' });
    expect(result.success).toBe(false);
  });

  it('should require DATABASE_URL', () => {
    const result = parseEnv({ DATABASE_URL: undefined });
    expect(result.success).toBe(false);
  });
});
