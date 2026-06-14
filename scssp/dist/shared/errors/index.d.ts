export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly isOperational: boolean;
    constructor(message: string, statusCode: number, code: string, isOperational?: boolean);
}
export declare class NotFoundError extends AppError {
    constructor(entity: string, id: string);
}
export declare class ValidationError extends AppError {
    constructor(message: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare class RateLimitError extends AppError {
    constructor();
}
export declare class InternalError extends AppError {
    constructor(message?: string);
}
//# sourceMappingURL=index.d.ts.map