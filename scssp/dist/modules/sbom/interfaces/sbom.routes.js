"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sbomRoutes = sbomRoutes;
const sbom_service_1 = require("../application/sbom.service");
const sbom_types_1 = require("../domain/sbom.types");
const auth_1 = require("@shared/middleware/auth");
const errors_1 = require("@shared/errors");
async function sbomRoutes(app) {
    app.addHook('preHandler', auth_1.authenticate);
    app.get('/search', {
        preHandler: [(0, auth_1.authorize)('SBOM_READ')],
    }, async (request) => {
        const { q, page, limit } = request.query;
        if (!q || q.length < 2)
            return { success: true, items: [], total: 0, page: 1, limit: 50 };
        const result = await sbom_service_1.sbomService.searchPackages(q, Number(page) || 1, Number(limit) || 50);
        return { success: true, ...result };
    });
    app.post('/', {
        preHandler: [(0, auth_1.authorize)('SBOM_CREATE')],
    }, async (request, reply) => {
        const parsed = sbom_types_1.createSbomSchema.safeParse(request.body);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await sbom_service_1.sbomService.generate(parsed.data, request.user.userId);
        return reply.code(201).send({ success: true, data: result });
    });
    app.get('/', {
        preHandler: [(0, auth_1.authorize)('SBOM_READ')],
    }, async (request) => {
        const parsed = sbom_types_1.sbomQuerySchema.safeParse(request.query);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await sbom_service_1.sbomService.findAll(parsed.data);
        return { success: true, ...result };
    });
    app.get('/:id', {
        preHandler: [(0, auth_1.authorize)('SBOM_READ')],
    }, async (request) => {
        const { id } = request.params;
        const result = await sbom_service_1.sbomService.findById(id);
        return { success: true, data: result };
    });
    app.delete('/:id', {
        preHandler: [(0, auth_1.authorize)('SBOM_DELETE')],
    }, async (request, reply) => {
        const { id } = request.params;
        await sbom_service_1.sbomService.delete(id, request.user.userId);
        return reply.code(204).send();
    });
}
//# sourceMappingURL=sbom.routes.js.map