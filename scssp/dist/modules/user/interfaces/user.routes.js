"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = userRoutes;
const user_service_1 = require("../application/user.service");
const user_types_1 = require("../domain/user.types");
const auth_1 = require("@shared/middleware/auth");
const errors_1 = require("@shared/errors");
async function userRoutes(app) {
    app.addHook('preHandler', auth_1.authenticate);
    app.post('/', {
        preHandler: [(0, auth_1.authorize)('USER_CREATE')],
    }, async (request, reply) => {
        const parsed = user_types_1.createUserSchema.safeParse(request.body);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await user_service_1.userService.create(parsed.data, request.user.userId);
        return reply.code(201).send({ success: true, data: result });
    });
    app.get('/', {
        preHandler: [(0, auth_1.authorize)('USER_READ')],
    }, async (request) => {
        const parsed = user_types_1.userQuerySchema.safeParse(request.query);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await user_service_1.userService.findAll(parsed.data);
        return { success: true, ...result };
    });
    app.get('/me', async (request) => {
        const result = await user_service_1.userService.findById(request.user.userId);
        return { success: true, data: result };
    });
    app.patch('/me', async (request) => {
        const parsed = user_types_1.updateUserSchema.safeParse(request.body);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await user_service_1.userService.update(request.user.userId, parsed.data, request.user.userId);
        return { success: true, data: result };
    });
    app.get('/:id', {
        preHandler: [(0, auth_1.authorize)('USER_READ')],
    }, async (request) => {
        const { id } = request.params;
        const result = await user_service_1.userService.findById(id);
        return { success: true, data: result };
    });
    app.patch('/:id', {
        preHandler: [(0, auth_1.authorize)('USER_UPDATE')],
    }, async (request) => {
        const { id } = request.params;
        const parsed = user_types_1.updateUserSchema.safeParse(request.body);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await user_service_1.userService.update(id, parsed.data, request.user.userId);
        return { success: true, data: result };
    });
    app.delete('/:id', {
        preHandler: [(0, auth_1.authorize)('USER_DELETE')],
    }, async (request, reply) => {
        const { id } = request.params;
        await user_service_1.userService.delete(id, request.user.userId);
        return reply.code(204).send();
    });
}
//# sourceMappingURL=user.routes.js.map