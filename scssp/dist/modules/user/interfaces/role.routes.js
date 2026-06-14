"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleRoutes = roleRoutes;
const role_service_1 = require("../application/role.service");
const role_types_1 = require("../domain/role.types");
const auth_1 = require("@shared/middleware/auth");
const errors_1 = require("@shared/errors");
async function roleRoutes(app) {
    app.addHook('preHandler', auth_1.authenticate);
    app.post('/', {
        preHandler: [(0, auth_1.authorize)('ROLE_CREATE')],
    }, async (request, reply) => {
        const parsed = role_types_1.createRoleSchema.safeParse(request.body);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await role_service_1.roleService.create(parsed.data, request.user.userId);
        return reply.code(201).send({ success: true, data: result });
    });
    app.get('/', {
        preHandler: [(0, auth_1.authorize)('ROLE_READ')],
    }, async (request) => {
        const query = request.query;
        const result = await role_service_1.roleService.findAll(Number(query.page) || 1, Number(query.limit) || 20);
        return { success: true, ...result };
    });
    app.get('/:id', {
        preHandler: [(0, auth_1.authorize)('ROLE_READ')],
    }, async (request) => {
        const { id } = request.params;
        const result = await role_service_1.roleService.findById(id);
        return { success: true, data: result };
    });
    app.patch('/:id', {
        preHandler: [(0, auth_1.authorize)('ROLE_UPDATE')],
    }, async (request) => {
        const { id } = request.params;
        const parsed = role_types_1.updateRoleSchema.safeParse(request.body);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await role_service_1.roleService.update(id, parsed.data, request.user.userId);
        return { success: true, data: result };
    });
    app.delete('/:id', {
        preHandler: [(0, auth_1.authorize)('ROLE_DELETE')],
    }, async (request, reply) => {
        const { id } = request.params;
        await role_service_1.roleService.delete(id, request.user.userId);
        return reply.code(204).send();
    });
}
//# sourceMappingURL=role.routes.js.map