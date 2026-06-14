export interface Repository<T, ID = string> {
    findById(id: ID): Promise<T | null>;
    findAll(params?: {
        skip?: number;
        take?: number;
        where?: Record<string, unknown>;
        orderBy?: Record<string, 'asc' | 'desc'>;
    }): Promise<T[]>;
    count(where?: Record<string, unknown>): Promise<number>;
    create(data: Partial<T>): Promise<T>;
    update(id: ID, data: Partial<T>): Promise<T>;
    delete(id: ID): Promise<T>;
}
//# sourceMappingURL=repository.d.ts.map