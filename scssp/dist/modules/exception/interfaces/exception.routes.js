"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exceptionRoutes = exceptionRoutes;
const exception_service_1 = require("../application/exception.service");
const auth_1 = require("@shared/middleware/auth");
const errors_1 = require("@shared/errors");
async function exceptionRoutes(app) {
    app.post('/', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_EXCEPTION')] }, async (request, reply) => {
        const body = request.body;
        if (!body.cveId || !body.reason || !body.expiresAt)
            throw new errors_1.ValidationError('cveId, reason, and expiresAt required');
        const result = await exception_service_1.exceptionService.create(body, request.user.userId);
        return reply.code(201).send({ success: true, data: result });
    });
    app.get('/', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_READ')] }, async (request, reply) => {
        const query = request.query;
        const result = await exception_service_1.exceptionService.findAll({
            isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
            cveId: query.cveId,
            page: parseInt(query.page || '1'),
            limit: parseInt(query.limit || '20'),
        });
        return { success: true, data: result.items, total: result.total };
    });
    app.get('/:id', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_READ')] }, async (request, reply) => {
        const result = await exception_service_1.exceptionService.findById(request.params.id);
        return { success: true, data: result };
    });
    app.post('/:id/approve', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_EXCEPTION')] }, async (request, reply) => {
        const result = await exception_service_1.exceptionService.approve(request.params.id, request.user.userId);
        return { success: true, data: result };
    });
    app.post('/:id/revoke', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_EXCEPTION')] }, async (request, reply) => {
        const result = await exception_service_1.exceptionService.revoke(request.params.id, request.user.userId);
        return { success: true, data: result };
    });
}
//# sourceMappingURL=exception.routes.js.map