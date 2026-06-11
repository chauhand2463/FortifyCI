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

  app.get('/stats', {
    preHandler: [authorize('VULNERABILITY_READ')],
  }, async () => {
    const { stats } = await dashboardService.getDashboard();
    return { success: true, data: stats };
  });

  app.get('/chart', {
    preHandler: [authorize('VULNERABILITY_READ')],
  }, async () => {
    const { chartData } = await dashboardService.getDashboard();
    return { success: true, data: chartData };
  });
}
