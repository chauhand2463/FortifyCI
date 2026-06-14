"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
const jwt_1 = require("@shared/utils/jwt");
const errors_1 = require("@shared/errors");
async function authenticate(request, reply) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        throw new errors_1.UnauthorizedError('Missing or invalid authorization header');
    }
    const token = authHeader.slice(7);
    try {
        const payload = await (0, jwt_1.verifyToken)(token);
        if (payload.type !== 'access') {
            throw new errors_1.UnauthorizedError('Invalid token type');
        }
        request.user = payload;
    }
    catch (error) {
        if (error instanceof errors_1.UnauthorizedError)
            throw error;
        throw new errors_1.UnauthorizedError('Invalid or expired token');
    }
}
function authorize(...requiredPermissions) {
    return async (request, reply) => {
        if (!request.user) {
            throw new errors_1.UnauthorizedError();
        }
        const userPermissions = request.user.permissions ?? [];
        const hasAll = requiredPermissions.every((perm) => userPermissions.includes(perm));
        if (!hasAll) {
            throw new errors_1.ForbiddenError('Insufficient permissions');
        }
    };
}
//# sourceMappingURL=auth.js.map