"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionRoutes = permissionRoutes;
const permission_service_1 = require("../application/permission.service");
const auth_1 = require("@shared/middleware/auth");
async function permissionRoutes(app) {
    app.addHook('preHandler', auth_1.authenticate);
    app.addHook('preHandler', (0, auth_1.authorize)('ROLE_READ'));
    app.get('/', async (_request) => {
        const result = await permission_service_1.permissionService.findAll();
        return { success: true, data: result };
    });
}
//# sourceMappingURL=permission.routes.js.map