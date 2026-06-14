"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueue = getQueue;
exports.createWorker = createWorker;
exports.closeAllQueues = closeAllQueues;
const bullmq_1 = require("bullmq");
const redis_1 = require("@shared/database/redis");
const env_1 = require("@shared/config/env");
const queues = new Map();
function getConnection() {
    const redis = (0, redis_1.getRedis)();
    return {
        host: redis.options.host,
        port: redis.options.port,
        password: redis.options.password,
        db: redis.options.db,
    };
}
function getQueue(name) {
    if (!queues.has(name)) {
        const queue = new bullmq_1.Queue(name, { connection: getConnection() });
        queues.set(name, queue);
    }
    return queues.get(name);
}
function createWorker(name, processor) {
    const env = (0, env_1.getEnv)();
    return new bullmq_1.Worker(name, processor, {
        connection: getConnection(),
        concurrency: env.WORKER_CONCURRENCY,
        lockDuration: 60000,
        stalledInterval: 30000,
        maxStalledCount: 3,
    });
}
async function closeAllQueues() {
    for (const [, queue] of queues) {
        await queue.close();
    }
    queues.clear();
}
//# sourceMappingURL=index.js.map