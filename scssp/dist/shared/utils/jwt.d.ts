import { type JWTPayload } from 'jose';
export interface TokenPayload extends JWTPayload {
    sub: string;
    userId: string;
    role: string;
    permissions: string[];
    type: 'access' | 'refresh';
}
export declare function generateAccessToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): Promise<string>;
export declare function generateRefreshToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): Promise<string>;
export declare function verifyToken(token: string): Promise<TokenPayload>;
//# sourceMappingURL=jwt.d.ts.map