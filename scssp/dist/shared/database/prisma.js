"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrisma = getPrisma;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
const env_1 = require("@shared/config/env");
let _prisma = null;
function getPrisma() {
    if (!_prisma) {
        const env = (0, env_1.getEnv)();
        _prisma = new client_1.PrismaClient({
            log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
            datasourceUrl: env.DATABASE_URL + (env.DATABASE_URL.includes('?') ? '&' : '?') + 'connection_limit=20&pool_timeout=30',
        });
    }
    return _prisma;
}
async function connectDatabase() {
    const prisma = getPrisma();
    await prisma.$connect();
}
async function disconnectDatabase() {
    if (_prisma) {
        await _prisma.$disconnect();
        _prisma = null;
    }
}
//# sourceMappingURL=prisma.js.map