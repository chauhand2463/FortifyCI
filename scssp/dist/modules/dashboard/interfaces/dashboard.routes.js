"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = dashboardRoutes;
const dashboard_service_1 = require("../application/dashboard.service");
const auth_1 = require("@shared/middleware/auth");
async function dashboardRoutes(app) {
    app.addHook('preHandler', auth_1.authenticate);
    app.get('/', {
        preHandler: [(0, auth_1.authorize)('VULNERABILITY_READ')],
    }, async () => {
        const result = await dashboard_service_1.dashboardService.getDashboard();
        return { success: true, data: result };
    });
    app.get('/stats', {
        preHandler: [(0, auth_1.authorize)('VULNERABILITY_READ')],
    }, async () => {
        const { stats } = await dashboard_service_1.dashboardService.getDashboard();
        return { success: true, data: stats };
    });
    app.get('/chart', {
        preHandler: [(0, auth_1.authorize)('VULNERABILITY_READ')],
    }, async () => {
        const { chartData } = await dashboard_service_1.dashboardService.getDashboard();
        return { success: true, data: chartData };
    });
}
//# sourceMappingURL=dashboard.routes.js.map