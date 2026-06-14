"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationQuerySchema = void 0;
const zod_1 = require("zod");
exports.notificationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().optional().default(1),
    limit: zod_1.z.coerce.number().optional().default(20),
    isRead: zod_1.z.coerce.boolean().optional(),
    type: zod_1.z.string().optional(),
});
//# sourceMappingURL=notification.types.js.map