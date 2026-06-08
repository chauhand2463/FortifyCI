import Redis from 'ioredis';
import { getEnv } from '@shared/config/env';

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    const env = getEnv();
    _redis = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      db: env.REDIS_DB,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: null,
    });
  }
  return _redis;
}

export async function connectRedis(): Promise<void> {
  const redis = getRedis();
  await redis.ping();
}

export async function disconnectRedis(): Promise<void> {
  if (_redis) {
    _redis.disconnect();
    _redis = null;
  }
}
