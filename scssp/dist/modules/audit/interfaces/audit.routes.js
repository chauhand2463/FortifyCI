"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRoutes = auditRoutes;
const audit_service_1 = require("../application/audit.service");
const auth_1 = require("@shared/middleware/auth");
async function auditRoutes(app) {
    app.addHook('preHandler', auth_1.authenticate);
    app.get('/', {
        preHandler: [(0, auth_1.authorize)('AUDIT_LOG_READ')],
    }, async (request) => {
        const query = request.query;
        const result = await audit_service_1.auditService.search({
            action: query.action,
            entity: query.entity,
            userId: query.userId,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            limit: Number(query.limit) || 50,
            offset: ((Number(query.page) || 1) - 1) * (Number(query.limit) || 50),
        });
        return { success: true, ...result };
    });
    app.get('/user/:userId', {
        preHandler: [(0, auth_1.authorize)('AUDIT_LOG_READ')],
    }, async (request) => {
        const { userId } = request.params;
        const query = request.query;
        const limit = Number(query.limit) || 50;
        const offset = ((Number(query.page) || 1) - 1) * limit;
        const items = await audit_service_1.auditService.findByUser(userId, limit, offset);
        return { success: true, data: items };
    });
}
//# sourceMappingURL=audit.routes.js.map