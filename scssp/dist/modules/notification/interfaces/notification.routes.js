"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoutes = notificationRoutes;
const notification_service_1 = require("../application/notification.service");
const notification_types_1 = require("../domain/notification.types");
const auth_1 = require("@shared/middleware/auth");
const errors_1 = require("@shared/errors");
async function notificationRoutes(app) {
    app.addHook('preHandler', auth_1.authenticate);
    app.get('/', {
        preHandler: [(0, auth_1.authorize)('NOTIFICATION_READ')],
    }, async (request) => {
        const parsed = notification_types_1.notificationQuerySchema.safeParse(request.query);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await notification_service_1.notificationService.findAll(parsed.data, request.user.userId);
        return { success: true, ...result };
    });
    app.get('/unread-count', {
        preHandler: [(0, auth_1.authorize)('NOTIFICATION_READ')],
    }, async (request) => {
        const count = await notification_service_1.notificationService.getUnreadCount(request.user.userId);
        return { success: true, data: { count } };
    });
    app.patch('/:id/read', {
        preHandler: [(0, auth_1.authorize)('NOTIFICATION_MANAGE')],
    }, async (request) => {
        const { id } = request.params;
        await notification_service_1.notificationService.markAsRead(id, request.user.userId);
        return { success: true };
    });
    app.post('/read-all', {
        preHandler: [(0, auth_1.authorize)('NOTIFICATION_MANAGE')],
    }, async (request) => {
        await notification_service_1.notificationService.markAllAsRead(request.user.userId);
        return { success: true };
    });
}
//# sourceMappingURL=notification.routes.js.map