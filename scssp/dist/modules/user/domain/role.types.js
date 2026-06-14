"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleQuerySchema = exports.updateRoleSchema = exports.createRoleSchema = void 0;
const zod_1 = require("zod");
exports.createRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50),
    description: zod_1.z.string().max(255).optional(),
    permissions: zod_1.z.array(zod_1.z.string().uuid()).optional().default([]),
});
exports.updateRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50).optional(),
    description: zod_1.z.string().max(255).optional(),
    permissions: zod_1.z.array(zod_1.z.string().uuid()).optional(),
});
exports.roleQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().optional().default(1),
    limit: zod_1.z.coerce.number().optional().default(20),
});
//# sourceMappingURL=role.types.js.map