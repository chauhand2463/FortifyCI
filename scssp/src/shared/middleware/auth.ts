import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, type TokenPayload } from '@shared/utils/jwt';
import { UnauthorizedError, ForbiddenError } from '@shared/errors';

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token);
    if (payload.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }
    request.user = payload;
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export function authorize(...requiredPermissions: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError();
    }

    const userPermissions = request.user.permissions ?? [];
    const hasAll = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasAll) {
      throw new ForbiddenError('Insufficient permissions');
    }
  };
}
