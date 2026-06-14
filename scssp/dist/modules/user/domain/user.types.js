"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userQuerySchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    username: zod_1.z.string().min(3).max(50),
    password: zod_1.z.string().min(12).max(128),
    roleId: zod_1.z.string().uuid(),
    isActive: zod_1.z.boolean().optional().default(true),
});
exports.updateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    username: zod_1.z.string().min(3).max(50).optional(),
    isActive: zod_1.z.boolean().optional(),
    roleId: zod_1.z.string().uuid().optional(),
});
exports.userQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().optional().default(1),
    limit: zod_1.z.coerce.number().optional().default(20),
    search: zod_1.z.string().optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    roleId: zod_1.z.string().uuid().optional(),
    sortBy: zod_1.z.enum(['createdAt', 'email', 'username']).optional().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
//# sourceMappingURL=user.types.js.map