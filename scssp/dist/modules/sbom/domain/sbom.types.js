"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sbomQuerySchema = exports.createSbomSchema = void 0;
const zod_1 = require("zod");
exports.createSbomSchema = zod_1.z.object({
    imageId: zod_1.z.string().uuid(),
    format: zod_1.z.enum(['SPDX', 'CYCLONEDX']).default('SPDX'),
    specVersion: zod_1.z.string().optional().default('2.3'),
});
exports.sbomQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().optional().default(1),
    limit: zod_1.z.coerce.number().optional().default(20),
    format: zod_1.z.enum(['SPDX', 'CYCLONEDX']).optional(),
    imageId: zod_1.z.string().uuid().optional(),
    sortBy: zod_1.z.enum(['createdAt', 'format']).optional().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
//# sourceMappingURL=sbom.types.js.map