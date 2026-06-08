import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import { getRedis } from '@shared/database/redis';
import { getEnv } from '@shared/config/env';

const queues = new Map<string, Queue>();

function getConnection(): ConnectionOptions {
  const redis = getRedis();
  return {
    host: redis.options.host,
    port: redis.options.port,
    password: redis.options.password,
    db: redis.options.db,
  } as ConnectionOptions;
}

export function getQueue(name: string): Queue {
  if (!queues.has(name)) {
    const queue = new Queue(name, { connection: getConnection() });
    queues.set(name, queue);
  }
  return queues.get(name)!;
}

export function createWorker(
  name: string,
  processor: (job: any) => Promise<void>,
): Worker {
  const env = getEnv();
  return new Worker(name, processor, {
    connection: getConnection(),
    concurrency: env.WORKER_CONCURRENCY,
    lockDuration: 60000,
    stalledInterval: 30000,
    maxStalledCount: 3,
  });
}

export async function closeAllQueues(): Promise<void> {
  for (const [, queue] of queues) {
    await queue.close();
  }
  queues.clear();
}
