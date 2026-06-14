"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffRoutes = diffRoutes;
const diff_service_1 = require("../application/diff.service");
const auth_1 = require("@shared/middleware/auth");
const errors_1 = require("@shared/errors");
async function diffRoutes(app) {
    app.get('/:id/diff', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('SCAN_READ')] }, async (request, reply) => {
        const result = await diff_service_1.diffService.getDiffForScan(request.params.id);
        return { success: true, data: result };
    });
    app.get('/diff', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('SCAN_READ')] }, async (request, reply) => {
        const { scanA, scanB } = request.query;
        if (!scanA || !scanB)
            throw new errors_1.ValidationError('Both scanA and scanB query params required');
        const result = await diff_service_1.diffService.getManualDiff(scanA, scanB);
        return { success: true, data: result };
    });
}
//# sourceMappingURL=diff.routes.js.map