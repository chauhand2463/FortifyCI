"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanQuerySchema = exports.createScanSchema = void 0;
const zod_1 = require("zod");
exports.createScanSchema = zod_1.z.object({
    imageId: zod_1.z.string().uuid(),
    scanType: zod_1.z.string().default('trivy'),
    maxRetries: zod_1.z.coerce.number().min(0).max(10).optional().default(3),
    metadata: zod_1.z.any().optional(),
});
exports.scanQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().optional().default(1),
    limit: zod_1.z.coerce.number().optional().default(20),
    status: zod_1.z.string().optional(),
    imageId: zod_1.z.string().uuid().optional(),
    sortBy: zod_1.z.enum(['createdAt', 'status', 'startedAt', 'completedAt']).optional().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
//# sourceMappingURL=scan.types.js.map