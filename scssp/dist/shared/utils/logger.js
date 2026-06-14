"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = getLogger;
const pino_1 = __importDefault(require("pino"));
const env_1 = require("@shared/config/env");
let _logger = null;
function getLogger() {
    if (!_logger) {
        const env = (0, env_1.getEnv)();
        _logger = (0, pino_1.default)({
            level: env.LOG_LEVEL,
            transport: env.LOG_PRETTY
                ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
                : undefined,
            serializers: {
                req: pino_1.default.stdSerializers.req,
                res: pino_1.default.stdSerializers.res,
                err: pino_1.default.stdSerializers.err,
            },
        });
    }
    return _logger;
}
//# sourceMappingURL=logger.js.map