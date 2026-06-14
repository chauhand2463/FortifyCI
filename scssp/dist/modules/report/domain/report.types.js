"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportQuerySchema = exports.createReportSchema = void 0;
const zod_1 = require("zod");
exports.createReportSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(255),
    format: zod_1.z.enum(['PDF', 'CSV', 'JSON']).default('PDF'),
    scanId: zod_1.z.string().uuid().optional(),
    imageId: zod_1.z.string().uuid().optional(),
    parameters: zod_1.z.object({
        includeVulnerabilities: zod_1.z.boolean().optional().default(true),
        includeSbom: zod_1.z.boolean().optional().default(true),
        severityFilter: zod_1.z.array(zod_1.z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'])).optional(),
        dateRange: zod_1.z.object({
            start: zod_1.z.string().datetime().optional(),
            end: zod_1.z.string().datetime().optional(),
        }).optional(),
    }).passthrough().optional(),
});
exports.reportQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().optional().default(1),
    limit: zod_1.z.coerce.number().optional().default(20),
    format: zod_1.z.enum(['PDF', 'CSV', 'JSON']).optional(),
    status: zod_1.z.string().optional(),
});
//# sourceMappingURL=report.types.js.map