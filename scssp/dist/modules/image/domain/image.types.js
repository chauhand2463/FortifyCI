"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageQuerySchema = exports.registerImageSchema = void 0;
const zod_1 = require("zod");
exports.registerImageSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    tag: zod_1.z.string().default('latest'),
    registry: zod_1.z.string().default('docker.io'),
    repository: zod_1.z.string().min(1).max(255),
    digest: zod_1.z.string().optional(),
    architecture: zod_1.z.string().optional(),
    os: zod_1.z.string().optional(),
    mediaType: zod_1.z.string().optional(),
    registryCredentials: zod_1.z.object({
        username: zod_1.z.string(),
        password: zod_1.z.string(),
        serverAddress: zod_1.z.string().optional(),
    }).optional(),
    manifest: zod_1.z.any().optional(),
    config: zod_1.z.any().optional(),
    labels: zod_1.z.any().optional(),
});
exports.imageQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().optional().default(1),
    limit: zod_1.z.coerce.number().optional().default(20),
    search: zod_1.z.string().optional(),
    registry: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['createdAt', 'name', 'tag']).optional().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
//# sourceMappingURL=image.types.js.map