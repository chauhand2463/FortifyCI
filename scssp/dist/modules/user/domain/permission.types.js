"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPermissionSchema = void 0;
const zod_1 = require("zod");
exports.createPermissionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(255).optional(),
});
//# sourceMappingURL=permission.types.js.map