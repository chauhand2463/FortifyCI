import { PrismaClient } from '@prisma/client';
import { getEnv } from '@shared/config/env';

let _prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!_prisma) {
    const env = getEnv();
    _prisma = new PrismaClient({
      log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
      datasourceUrl: env.DATABASE_URL + (env.DATABASE_URL.includes('?') ? '&' : '?') + 'connection_limit=20&pool_timeout=30',
    });
  }
  return _prisma;
}

export async function connectDatabase(): Promise<void> {
  const prisma = getPrisma();
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  if (_prisma) {
    await _prisma.$disconnect();
    _prisma = null;
  }
}
