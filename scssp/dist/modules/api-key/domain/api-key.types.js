"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyQuerySchema = exports.createApiKeySchema = void 0;
const zod_1 = require("zod");
exports.createApiKeySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    permissions: zod_1.z.array(zod_1.z.string()).optional().default([]),
    expiresAt: zod_1.z.string().datetime().optional(),
});
exports.apiKeyQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().optional().default(1),
    limit: zod_1.z.coerce.number().optional().default(20),
});
//# sourceMappingURL=api-key.types.js.map