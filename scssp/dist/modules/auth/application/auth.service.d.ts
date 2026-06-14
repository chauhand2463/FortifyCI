import type { RegisterDto, LoginDto, AuthResponse, TokenPair } from '../domain/auth.types';
export declare class AuthService {
    private createTokenPair;
    private persistRefreshToken;
    private revokeRefreshToken;
    private revokeAllUserTokens;
    register(dto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse>;
    login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse>;
    refreshToken(refreshTokenJwt: string, ipAddress?: string, userAgent?: string): Promise<TokenPair>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(token: string, newPassword: string): Promise<void>;
    logout(userId: string, refreshTokenJwt?: string, ipAddress?: string, userAgent?: string): Promise<void>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map