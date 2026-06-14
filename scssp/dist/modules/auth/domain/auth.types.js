"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = void 0;
const zod_1 = require("zod");
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    password: zod_1.z
        .string()
        .min(12, 'Password must be at least 12 characters')
        .max(128)
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters').max(50),
    password: zod_1.z
        .string()
        .min(12, 'Password must be at least 12 characters')
        .max(128)
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(12).max(128),
});
//# sourceMappingURL=auth.types.js.map