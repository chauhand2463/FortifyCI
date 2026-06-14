"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionService = exports.PermissionService = void 0;
const prisma_1 = require("@shared/database/prisma");
class PermissionService {
    async findAll() {
        const prisma = (0, prisma_1.getPrisma)();
        const permissions = await prisma.permission.findMany({
            orderBy: { name: 'asc' },
        });
        return permissions.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        }));
    }
}
exports.PermissionService = PermissionService;
exports.permissionService = new PermissionService();
//# sourceMappingURL=permission.service.js.map