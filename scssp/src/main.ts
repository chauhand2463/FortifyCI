import Fastify from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyCookie from '@fastify/cookie';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { getEnv } from '@shared/config/env';
import { getLogger } from '@shared/utils/logger';
import { connectDatabase, disconnectDatabase } from '@shared/database/prisma';
import { connectRedis, disconnectRedis } from '@shared/database/redis';
import { closeAllQueues } from '@shared/queue';
import { startWorkers } from '@modules/job/application/worker';
import { collectMetrics } from '@shared/monitoring/metrics';

import { authRoutes } from '@modules/auth/interfaces/auth.routes';
import { userRoutes } from '@modules/user/interfaces/user.routes';
import { roleRoutes } from '@modules/user/interfaces/role.routes';
import { permissionRoutes } from '@modules/user/interfaces/permission.routes';
import { imageRoutes } from '@modules/image/interfaces/image.routes';
import { scanRoutes } from '@modules/scan/interfaces/scan.routes';
import { vulnerabilityRoutes } from '@modules/vulnerability/interfaces/vulnerability.routes';
import { sbomRoutes } from '@modules/sbom/interfaces/sbom.routes';
import { reportRoutes } from '@modules/report/interfaces/report.routes';
import { notificationRoutes } from '@modules/notification/interfaces/notification.routes';
import { auditRoutes } from '@modules/audit/interfaces/audit.routes';
import { dashboardRoutes } from '@modules/dashboard/interfaces/dashboard.routes';

const logger = getLogger();

export async function buildApp() {
  const env = getEnv();

  const app = Fastify({
    logger: logger as any,
    bodyLimit: 10 * 1024 * 1024,
  });

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-origin' },
  });

  await app.register(fastifyCors, {
    origin: env.NODE_ENV === 'production' ? env.CORS_ORIGIN : true,
    credentials: true,
  });

  await app.register(fastifyRateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
  });

  await app.register(fastifyCookie, {
    secret: env.COOKIE_SECRET || env.ENCRYPTION_KEY.slice(0, 32),
    parseOptions: {},
  });

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'FortifyCI API',
        description: 'FortifyCI REST API for container security scanning, vulnerability management, SBOM generation, and reporting',
        version: '1.0.0',
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

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  app.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode || 500;
    const code = (error as any).code || 'INTERNAL_ERROR';

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
      const metrics = await collectMetrics();
      reply.header('Content-Type', 'text/plain; charset=utf-8');
      return reply.send(metrics);
    });
  }

  const apiPrefix = env.API_PREFIX;
  await app.register(async (api) => {
    api.register(authRoutes, { prefix: '/auth' });
    api.register(userRoutes, { prefix: '/users' });
    api.register(roleRoutes, { prefix: '/roles' });
    api.register(permissionRoutes, { prefix: '/permissions' });
    api.register(imageRoutes, { prefix: '/images' });
    api.register(scanRoutes, { prefix: '/scans' });
    api.register(vulnerabilityRoutes, { prefix: '/vulnerabilities' });
    api.register(sbomRoutes, { prefix: '/sboms' });
    api.register(reportRoutes, { prefix: '/reports' });
    api.register(notificationRoutes, { prefix: '/notifications' });
    api.register(auditRoutes, { prefix: '/audit-logs' });
    api.register(dashboardRoutes, { prefix: '/dashboard' });
  }, { prefix: apiPrefix });

  return app;
}

async function main() {
  const env = getEnv();

  try {
    await connectDatabase();
    await connectRedis();
    logger.info('Database and Redis connected');

    const app = await buildApp();

    if (env.NODE_ENV !== 'test') {
      await startWorkers();
    }

    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info({ port: env.PORT }, 'Server started');
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await disconnectDatabase();
  await disconnectRedis();
  await closeAllQueues();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await disconnectDatabase();
  await disconnectRedis();
  await closeAllQueues();
  process.exit(0);
});

main();
