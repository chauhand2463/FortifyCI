"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nvdRoutes = nvdRoutes;
const nvd_service_1 = require("../application/nvd.service");
const auth_1 = require("@shared/middleware/auth");
async function nvdRoutes(app) {
    app.get('/status', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('AUDIT_LOG_READ')] }, async (request, reply) => {
        const result = await nvd_service_1.nvdService.getStatus();
        return { success: true, data: result };
    });
    app.get('/recent', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_READ')] }, async (request, reply) => {
        const query = request.query;
        const result = await nvd_service_1.nvdService.getRecent({
            processed: query.processed !== undefined ? query.processed === 'true' : undefined,
            page: parseInt(query.page || '1'),
            limit: parseInt(query.limit || '20'),
        });
        return { success: true, data: result.items, total: result.total };
    });
}
//# sourceMappingURL=nvd.routes.js.map