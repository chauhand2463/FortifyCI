export interface CreateExceptionDto {
    cveId: string;
    imageId?: string;
    reason: string;
    approvedById?: string;
    expiresAt: string;
}
export interface ExceptionResponse {
    id: string;
    cveId: string;
    imageId: string | null;
    imageRef: string | null;
    reason: string;
    createdBy: {
        id: string;
        username: string;
    };
    approvedBy: {
        id: string;
        username: string;
    } | null;
    approvedAt: string | null;
    isActive: boolean;
    expiresAt: string;
    revokedAt: string | null;
    createdAt: string;
}
//# sourceMappingURL=exception.types.d.ts.map