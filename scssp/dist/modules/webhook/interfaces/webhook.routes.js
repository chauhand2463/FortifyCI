"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRoutes = webhookRoutes;
const webhook_service_1 = require("../application/webhook.service");
const auth_1 = require("@shared/middleware/auth");
const errors_1 = require("@shared/errors");
async function webhookRoutes(app) {
    app.post('/', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('WEBHOOK_MANAGE')] }, async (request, reply) => {
        const body = request.body;
        if (!body.name || !body.url || !body.secret || !body.events)
            throw new errors_1.ValidationError('name, url, secret, and events required');
        const result = await webhook_service_1.webhookService.create(body, request.user.userId);
        return reply.code(201).send({ success: true, data: result });
    });
    app.get('/', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('WEBHOOK_MANAGE')] }, async (request, reply) => {
        const result = await webhook_service_1.webhookService.findAll();
        return { success: true, data: result };
    });
    app.get('/:id', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('WEBHOOK_MANAGE')] }, async (request, reply) => {
        const result = await webhook_service_1.webhookService.findById(request.params.id);
        return { success: true, data: result };
    });
    app.patch('/:id', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('WEBHOOK_MANAGE')] }, async (request, reply) => {
        const result = await webhook_service_1.webhookService.update(request.params.id, request.body, request.user.userId);
        return { success: true, data: result };
    });
    app.delete('/:id', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('WEBHOOK_MANAGE')] }, async (request, reply) => {
        await webhook_service_1.webhookService.delete(request.params.id, request.user.userId);
        return { success: true };
    });
    app.post('/:id/test', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('WEBHOOK_MANAGE')] }, async (request, reply) => {
        const result = await webhook_service_1.webhookService.sendTest(request.params.id);
        return { success: true, data: result };
    });
}
//# sourceMappingURL=webhook.routes.js.map