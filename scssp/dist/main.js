"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const cors_1 = __importDefault(require("@fastify/cors"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const env_1 = require("@shared/config/env");
const logger_1 = require("@shared/utils/logger");
const prisma_1 = require("@shared/database/prisma");
const redis_1 = require("@shared/database/redis");
const queue_1 = require("@shared/queue");
const worker_1 = require("@modules/job/application/worker");
const cron_service_1 = require("@modules/cron/application/cron.service");
const metrics_1 = require("@shared/monitoring/metrics");
const auth_routes_1 = require("@modules/auth/interfaces/auth.routes");
const user_routes_1 = require("@modules/user/interfaces/user.routes");
const role_routes_1 = require("@modules/user/interfaces/role.routes");
const permission_routes_1 = require("@modules/user/interfaces/permission.routes");
const image_routes_1 = require("@modules/image/interfaces/image.routes");
const scan_routes_1 = require("@modules/scan/interfaces/scan.routes");
const vulnerability_routes_1 = require("@modules/vulnerability/interfaces/vulnerability.routes");
const sbom_routes_1 = require("@modules/sbom/interfaces/sbom.routes");
const report_routes_1 = require("@modules/report/interfaces/report.routes");
const notification_routes_1 = require("@modules/notification/interfaces/notification.routes");
const audit_routes_1 = require("@modules/audit/interfaces/audit.routes");
const dashboard_routes_1 = require("@modules/dashboard/interfaces/dashboard.routes");
const api_key_routes_1 = require("@modules/api-key/interfaces/api-key.routes");
const blast_radius_routes_1 = require("@modules/blast-radius/interfaces/blast-radius.routes");
const diff_routes_1 = require("@modules/diff/interfaces/diff.routes");
const assignment_routes_1 = require("@modules/assignment/interfaces/assignment.routes");
const exception_routes_1 = require("@modules/exception/interfaces/exception.routes");
const posture_routes_1 = require("@modules/posture/interfaces/posture.routes");
const policy_routes_1 = require("@modules/policy/interfaces/policy.routes");
const webhook_routes_1 = require("@modules/webhook/interfaces/webhook.routes");
const live_scan_routes_1 = require("@modules/live-scan/interfaces/live-scan.routes");
const nvd_routes_1 = require("@modules/nvd-watch/interfaces/nvd.routes");
const logger = (0, logger_1.getLogger)();
async function buildApp() {
    const env = (0, env_1.getEnv)();
    const app = (0, fastify_1.default)({
        logger: logger,
        bodyLimit: 10 * 1024 * 1024,
    });
    await app.register(helmet_1.default, {
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: 'same-origin' },
    });
    await app.register(cors_1.default, {
        origin: env.NODE_ENV === 'production' ? env.CORS_ORIGIN : true,
        credentials: true,
    });
    await app.register(rate_limit_1.default, {
        max: env.RATE_LIMIT_MAX,
        timeWindow: env.RATE_LIMIT_WINDOW_MS,
    });
    await app.register(cookie_1.default, {
        secret: env.COOKIE_SECRET || env.ENCRYPTION_KEY.slice(0, 32),
        parseOptions: {},
    });
    await app.register(swagger_1.default, {
        openapi: {
            info: {
                title: 'FortifyCI API',
                description: 'FortifyCI REST API for container security scanning, vulnerability management, SBOM generation, and reporting',
                version: '2.0.0',
            },
            servers: [{ url: `http://localhost:${env.PORT}${env.API_PREFIX}` }],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
        },
    });
    await app.register(swagger_ui_1.default, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
        },
    });
    app.setErrorHandler((error, request, reply) => {
        const statusCode = error.statusCode || 500;
        const code = error.code || 'INTERNAL_ERROR';
        if (statusCode >= 500) {
            logger.error({ err: error, req: request.url }, 'Internal Server Error');
        }
        return reply.status(statusCode).send({
            success: false,
            error: {
                code,
                message: error.message,
                ...(env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
            },
        });
    });
    app.setNotFoundHandler((_request, reply) => {
        return reply.status(404).send({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Route not found' },
        });
    });
    app.get('/health', async () => ({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        },
    }));
    if (env.PROMETHEUS_ENABLED) {
        app.get(env.PROMETHEUS_METRICS_PATH, async (_request, reply) => {
            const metrics = await (0, metrics_1.collectMetrics)();
            reply.header('Content-Type', 'text/plain; charset=utf-8');
            return reply.send(metrics);
        });
    }
    const apiPrefix = env.API_PREFIX;
    await app.register(async (api) => {
        api.register(auth_routes_1.authRoutes, { prefix: '/auth' });
        api.register(user_routes_1.userRoutes, { prefix: '/users' });
        api.register(role_routes_1.roleRoutes, { prefix: '/roles' });
        api.register(permission_routes_1.permissionRoutes, { prefix: '/permissions' });
        api.register(image_routes_1.imageRoutes, { prefix: '/images' });
        api.register(scan_routes_1.scanRoutes, { prefix: '/scans' });
        api.register(vulnerability_routes_1.vulnerabilityRoutes, { prefix: '/vulnerabilities' });
        api.register(sbom_routes_1.sbomRoutes, { prefix: '/sboms' });
        api.register(report_routes_1.reportRoutes, { prefix: '/reports' });
        api.register(notification_routes_1.notificationRoutes, { prefix: '/notifications' });
        api.register(audit_routes_1.auditRoutes, { prefix: '/audit-logs' });
        api.register(dashboard_routes_1.dashboardRoutes, { prefix: '/dashboard' });
        api.register(api_key_routes_1.apiKeyRoutes, { prefix: '/api-keys' });
        api.register(blast_radius_routes_1.blastRadiusRoutes, { prefix: '/blast-radius' });
        api.register(diff_routes_1.diffRoutes, { prefix: '/scans' });
        api.register(assignment_routes_1.assignmentRoutes, { prefix: '/assignments' });
        api.register(exception_routes_1.exceptionRoutes, { prefix: '/exceptions' });
        api.register(posture_routes_1.postureRoutes, { prefix: '/posture' });
        api.register(policy_routes_1.policyRoutes, { prefix: '/policies' });
        api.register(webhook_routes_1.webhookRoutes, { prefix: '/webhooks' });
        api.register(live_scan_routes_1.liveScanRoutes, { prefix: '/live-scan' });
        api.register(nvd_routes_1.nvdRoutes, { prefix: '/nvd-watch' });
    }, { prefix: apiPrefix });
    return app;
}
async function main() {
    const env = (0, env_1.getEnv)();
    try {
        await (0, prisma_1.connectDatabase)();
        await (0, redis_1.connectRedis)();
        logger.info('Database and Redis connected');
        const app = await buildApp();
        if (env.NODE_ENV !== 'test') {
            await (0, worker_1.startWorkers)();
            await (0, cron_service_1.startCronJobs)();
        }
        await app.listen({ port: env.PORT, host: env.HOST });
        logger.info({ port: env.PORT }, 'Server started');
    }
    catch (error) {
        logger.error({ err: error }, 'Failed to start server');
        process.exit(1);
    }
}
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    await (0, prisma_1.disconnectDatabase)();
    await (0, redis_1.disconnectRedis)();
    await (0, queue_1.closeAllQueues)();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    await (0, prisma_1.disconnectDatabase)();
    await (0, redis_1.disconnectRedis)();
    await (0, queue_1.closeAllQueues)();
    process.exit(0);
});
main();
//# sourceMappingURL=main.js.map