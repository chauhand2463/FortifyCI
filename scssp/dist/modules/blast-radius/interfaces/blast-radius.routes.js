"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blastRadiusRoutes = blastRadiusRoutes;
const blast_radius_service_1 = require("../application/blast-radius.service");
const auth_1 = require("@shared/middleware/auth");
const errors_1 = require("@shared/errors");
async function blastRadiusRoutes(app) {
    app.get('/cve/:cveId', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_READ')] }, async (request, reply) => {
        const { cveId } = request.params;
        if (!cveId)
            throw new errors_1.ValidationError('CVE ID is required');
        const result = await blast_radius_service_1.blastRadiusService.findByCve(cveId);
        return { success: true, data: result };
    });
    app.get('/package/:packageName', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_READ')] }, async (request, reply) => {
        const { packageName } = request.params;
        if (!packageName)
            throw new errors_1.ValidationError('Package name is required');
        const result = await blast_radius_service_1.blastRadiusService.findByPackage(packageName);
        return { success: true, data: result };
    });
    app.post('/cve/:cveId/rescan', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('SCAN_CREATE')] }, async (request, reply) => {
        const { cveId } = request.params;
        if (!cveId)
            throw new errors_1.ValidationError('CVE ID is required');
        const result = await blast_radius_service_1.blastRadiusService.bulkRescan(cveId, request.user.userId);
        return { success: true, data: result };
    });
}
//# sourceMappingURL=blast-radius.routes.js.map