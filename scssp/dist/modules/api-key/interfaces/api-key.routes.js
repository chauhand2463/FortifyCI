"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyRoutes = apiKeyRoutes;
const api_key_service_1 = require("../application/api-key.service");
const api_key_types_1 = require("../domain/api-key.types");
const auth_1 = require("@shared/middleware/auth");
const errors_1 = require("@shared/errors");
async function apiKeyRoutes(app) {
    app.addHook('preHandler', auth_1.authenticate);
    app.post('/', {
        preHandler: [(0, auth_1.authorize)('API_KEY_CREATE')],
    }, async (request, reply) => {
        const parsed = api_key_types_1.createApiKeySchema.safeParse(request.body);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await api_key_service_1.apiKeyService.create(parsed.data, request.user.userId);
        return reply.code(201).send({ success: true, data: result });
    });
    app.get('/', {
        preHandler: [(0, auth_1.authorize)('API_KEY_READ')],
    }, async (request) => {
        const parsed = api_key_types_1.apiKeyQuerySchema.safeParse(request.query);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await api_key_service_1.apiKeyService.findAll(parsed.data, request.user.userId);
        return { success: true, ...result };
    });
    app.delete('/:id', {
        preHandler: [(0, auth_1.authorize)('API_KEY_DELETE')],
    }, async (request, reply) => {
        const { id } = request.params;
        await api_key_service_1.apiKeyService.delete(id, request.user.userId);
        return reply.code(204).send();
    });
}
//# sourceMappingURL=api-key.routes.js.map