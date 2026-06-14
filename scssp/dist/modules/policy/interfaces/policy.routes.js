"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyRoutes = policyRoutes;
const policy_service_1 = require("../application/policy.service");
const auth_1 = require("@shared/middleware/auth");
async function policyRoutes(app) {
    app.post('/', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('POLICY_MANAGE')] }, async (request, reply) => {
        const result = await policy_service_1.policyService.create(request.body, request.user.userId);
        return reply.code(201).send({ success: true, data: result });
    });
    app.get('/', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_READ')] }, async (request, reply) => {
        const result = await policy_service_1.policyService.findAll();
        return { success: true, data: result };
    });
    app.get('/:id', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_READ')] }, async (request, reply) => {
        const result = await policy_service_1.policyService.findById(request.params.id);
        return { success: true, data: result };
    });
    app.patch('/:id', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('POLICY_MANAGE')] }, async (request, reply) => {
        const result = await policy_service_1.policyService.update(request.params.id, request.body, request.user.userId);
        return { success: true, data: result };
    });
    app.delete('/:id', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('POLICY_MANAGE')] }, async (request, reply) => {
        await policy_service_1.policyService.delete(request.params.id, request.user.userId);
        return { success: true };
    });
    app.post('/:id/set-default', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('POLICY_MANAGE')] }, async (request, reply) => {
        const result = await policy_service_1.policyService.setDefault(request.params.id, request.user.userId);
        return { success: true, data: result };
    });
    app.get('/:id/evaluate/:imageId', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_READ')] }, async (request, reply) => {
        const result = await policy_service_1.policyService.evaluate(request.params.imageId, request.params.id);
        return { success: true, data: result };
    });
    app.get('/evaluate/:imageId', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_READ')] }, async (request, reply) => {
        const result = await policy_service_1.policyService.evaluate(request.params.imageId);
        return { success: true, data: result };
    });
}
//# sourceMappingURL=policy.routes.js.map