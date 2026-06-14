"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = loadEnv;
exports.getEnv = getEnv;
exports.getConfig = getConfig;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(3000),
    HOST: zod_1.z.string().default('0.0.0.0'),
    API_PREFIX: zod_1.z.string().default('/api/v1'),
    DATABASE_URL: zod_1.z.string(),
    DATABASE_URL_TEST: zod_1.z.string().optional(),
    REDIS_HOST: zod_1.z.string().default('localhost'),
    REDIS_PORT: zod_1.z.coerce.number().default(6379),
    REDIS_PASSWORD: zod_1.z.string().optional().default(''),
    REDIS_DB: zod_1.z.coerce.number().default(0),
    JWT_PRIVATE_KEY_PATH: zod_1.z.string(),
    JWT_PUBLIC_KEY_PATH: zod_1.z.string(),
    JWT_ACCESS_TOKEN_EXPIRY: zod_1.z.string().default('15m'),
    JWT_REFRESH_TOKEN_EXPIRY: zod_1.z.string().default('7d'),
    JWT_ISSUER: zod_1.z.string().default('fortifyci'),
    JWT_AUDIENCE: zod_1.z.string().default('fortifyci-api'),
    COOKIE_SECRET: zod_1.z.string().optional(),
    CORS_ORIGIN: zod_1.z.string().optional(),
    ENCRYPTION_KEY: zod_1.z.string().min(32),
    ENCRYPTION_IV_LENGTH: zod_1.z.coerce.number().default(16),
    ARGON2_MEMORY_COST: zod_1.z.coerce.number().default(65536),
    ARGON2_TIME_COST: zod_1.z.coerce.number().default(3),
    ARGON2_PARALLELISM: zod_1.z.coerce.number().default(4),
    MINIO_ENDPOINT: zod_1.z.string().default('localhost'),
    MINIO_PORT: zod_1.z.coerce.number().default(9000),
    MINIO_ACCESS_KEY: zod_1.z.string(),
    MINIO_SECRET_KEY: zod_1.z.string(),
    MINIO_BUCKET: zod_1.z.string().default('fortifyci-images'),
    MINIO_USE_SSL: zod_1.z.coerce.boolean().default(false),
    MINIO_REGION: zod_1.z.string().default('us-east-1'),
    SMTP_HOST: zod_1.z.string().default('smtp.example.com'),
    SMTP_PORT: zod_1.z.coerce.number().default(587),
    SMTP_SECURE: zod_1.z.coerce.boolean().default(false),
    SMTP_USER: zod_1.z.string().default(''),
    SMTP_PASS: zod_1.z.string().default(''),
    EMAIL_FROM: zod_1.z.string().default('noreply@fortifyci.example.com'),
    EMAIL_FROM_NAME: zod_1.z.string().default('FortifyCI'),
    RATE_LIMIT_MAX: zod_1.z.coerce.number().default(100),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(60000),
    LOG_LEVEL: zod_1.z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    LOG_PRETTY: zod_1.z.coerce.boolean().default(true),
    TRIVY_BIN_PATH: zod_1.z.string().default('trivy'),
    TRIVY_DB_REPOSITORY: zod_1.z.string().default('ghcr.io/aquasecurity/trivy-db:2'),
    TRIVY_JAVA_DB_REPOSITORY: zod_1.z.string().default('ghcr.io/aquasecurity/trivy-java-db:1'),
    TRIVY_TIMEOUT: zod_1.z.coerce.number().default(300000),
    TRIVY_CACHE_DIR: zod_1.z.string().default('./.trivy-cache'),
    WORKER_CONCURRENCY: zod_1.z.coerce.number().default(5),
    SCAN_TIMEOUT_MS: zod_1.z.coerce.number().default(300000),
    PROMETHEUS_ENABLED: zod_1.z.coerce.boolean().default(true),
    PROMETHEUS_METRICS_PATH: zod_1.z.string().default('/metrics'),
});
let _env = null;
function loadEnv() {
    if (_env)
        return _env;
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error('Environment validation failed:');
        for (const issue of result.error.issues) {
            console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
        }
        process.exit(1);
    }
    if (result.data.NODE_ENV === 'production' && !result.data.CORS_ORIGIN) {
        console.error('Environment validation failed:');
        console.error('  - CORS_ORIGIN is required when NODE_ENV=production');
        process.exit(1);
    }
    _env = result.data;
    return _env;
}
function getEnv() {
    if (!_env)
        return loadEnv();
    return _env;
}
function getConfig() {
    return getEnv();
}
//# sourceMappingURL=env.js.map