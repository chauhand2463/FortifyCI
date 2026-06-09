import { FastifyInstance } from 'fastify';
import { dashboardService } from '../application/dashboard.service';
import { authenticate, authorize } from '@shared/middleware/auth';

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/', {
    preHandler: [authorize('VULNERABILITY_READ')],
  }, async () => {
    const result = await dashboardService.getDashboard();
    return { success: true, data: result };
  });
}
