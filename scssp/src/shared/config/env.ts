import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('/api/v1'),

  DATABASE_URL: z.string(),
  DATABASE_URL_TEST: z.string().optional(),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  REDIS_DB: z.coerce.number().default(0),

  JWT_PRIVATE_KEY_PATH: z.string(),
  JWT_PUBLIC_KEY_PATH: z.string(),
  JWT_ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
  JWT_ISSUER: z.string().default('fortifyci'),
  JWT_AUDIENCE: z.string().default('fortifyci-api'),
  COOKIE_SECRET: z.string().optional(),
  CORS_ORIGIN: z.string().default('*'),

  ENCRYPTION_KEY: z.string().min(32),
  ENCRYPTION_IV_LENGTH: z.coerce.number().default(16),

  ARGON2_MEMORY_COST: z.coerce.number().default(65536),
  ARGON2_TIME_COST: z.coerce.number().default(3),
  ARGON2_PARALLELISM: z.coerce.number().default(4),

  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET: z.string().default('fortifyci-images'),
  MINIO_USE_SSL: z.coerce.boolean().default(false),
  MINIO_REGION: z.string().default('us-east-1'),

  SMTP_HOST: z.string().default('smtp.example.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default('noreply@fortifyci.example.com'),
  EMAIL_FROM_NAME: z.string().default('FortifyCI'),

  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z.coerce.boolean().default(true),

  TRIVY_BIN_PATH: z.string().default('trivy'),
  TRIVY_DB_REPOSITORY: z.string().default('ghcr.io/aquasecurity/trivy-db:2'),
  TRIVY_JAVA_DB_REPOSITORY: z.string().default('ghcr.io/aquasecurity/trivy-java-db:1'),
  TRIVY_TIMEOUT: z.coerce.number().default(300000),
  TRIVY_CACHE_DIR: z.string().default('./.trivy-cache'),

  WORKER_CONCURRENCY: z.coerce.number().default(5),
  SCAN_TIMEOUT_MS: z.coerce.number().default(300000),
  REPORT_OUTPUT_DIR: z.string().default('./reports'),

  PROMETHEUS_ENABLED: z.coerce.boolean().default(true),
  PROMETHEUS_METRICS_PATH: z.string().default('/metrics'),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function loadEnv(): Env {
  if (_env) return _env;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Environment validation failed:');
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  _env = result.data;
  return _env;
}

export function getEnv(): Env {
  if (!_env) return loadEnv();
  return _env;
}

export function getConfig(): Env {
  return getEnv();
}
