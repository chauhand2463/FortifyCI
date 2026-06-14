import { FastifyRequest, FastifyReply } from 'fastify';
import { type TokenPayload } from '@shared/utils/jwt';
declare module 'fastify' {
    interface FastifyRequest {
        user?: TokenPayload;
    }
}
export declare function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function authorize(...requiredPermissions: string[]): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map