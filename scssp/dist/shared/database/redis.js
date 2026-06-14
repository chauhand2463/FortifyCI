"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = getRedis;
exports.connectRedis = connectRedis;
exports.disconnectRedis = disconnectRedis;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("@shared/config/env");
let _redis = null;
function getRedis() {
    if (!_redis) {
        const env = (0, env_1.getEnv)();
        _redis = new ioredis_1.default({
            host: env.REDIS_HOST,
            port: env.REDIS_PORT,
            password: env.REDIS_PASSWORD || undefined,
            db: env.REDIS_DB,
            retryStrategy: (times) => Math.min(times * 50, 2000),
            maxRetriesPerRequest: null,
        });
    }
    return _redis;
}
async function connectRedis() {
    const redis = getRedis();
    await redis.ping();
}
async function disconnectRedis() {
    if (_redis) {
        _redis.disconnect();
        _redis = null;
    }
}
//# sourceMappingURL=redis.js.map