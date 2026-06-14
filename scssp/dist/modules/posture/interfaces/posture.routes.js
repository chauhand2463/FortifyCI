"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postureRoutes = postureRoutes;
const posture_service_1 = require("../application/posture.service");
const auth_1 = require("@shared/middleware/auth");
async function postureRoutes(app) {
    app.get('/org', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_READ')] }, async (request, reply) => {
        const query = request.query;
        const result = await posture_service_1.postureService.getOrgTrend(query.dateFrom, query.dateTo);
        return { success: true, data: result };
    });
    app.get('/image/:imageId', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_READ')] }, async (request, reply) => {
        const result = await posture_service_1.postureService.getImageHistory(request.params.imageId);
        return { success: true, data: result };
    });
    app.get('/leaderboard', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_READ')] }, async (request, reply) => {
        const result = await posture_service_1.postureService.getLeaderboard();
        return { success: true, data: result };
    });
    app.get('/weekly-digest', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_READ')] }, async (request, reply) => {
        const result = await posture_service_1.postureService.getWeeklyDigest();
        return { success: true, data: result };
    });
}
//# sourceMappingURL=posture.routes.js.map