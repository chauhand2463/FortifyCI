"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageRoutes = imageRoutes;
const image_service_1 = require("../application/image.service");
const image_types_1 = require("../domain/image.types");
const auth_1 = require("@shared/middleware/auth");
const errors_1 = require("@shared/errors");
async function imageRoutes(app) {
    app.addHook('preHandler', auth_1.authenticate);
    app.post('/', {
        preHandler: [(0, auth_1.authorize)('IMAGE_REGISTER')],
    }, async (request, reply) => {
        const parsed = image_types_1.registerImageSchema.safeParse(request.body);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await image_service_1.imageService.register(parsed.data, request.user.userId);
        return reply.code(201).send({ success: true, data: result });
    });
    app.get('/', {
        preHandler: [(0, auth_1.authorize)('IMAGE_READ')],
    }, async (request) => {
        const parsed = image_types_1.imageQuerySchema.safeParse(request.query);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await image_service_1.imageService.findAll(parsed.data);
        return { success: true, ...result };
    });
    app.get('/:id', {
        preHandler: [(0, auth_1.authorize)('IMAGE_READ')],
    }, async (request) => {
        const { id } = request.params;
        const result = await image_service_1.imageService.findById(id);
        return { success: true, data: result };
    });
    app.delete('/:id', {
        preHandler: [(0, auth_1.authorize)('IMAGE_DELETE')],
    }, async (request, reply) => {
        const { id } = request.params;
        await image_service_1.imageService.delete(id, request.user.userId);
        return reply.code(204).send();
    });
}
//# sourceMappingURL=image.routes.js.map