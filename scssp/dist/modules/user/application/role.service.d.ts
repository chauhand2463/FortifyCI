import type { CreateRoleDto, UpdateRoleDto, RoleResponse } from '../domain/role.types';
export declare class RoleService {
    create(dto: CreateRoleDto, actorId?: string): Promise<RoleResponse>;
    findAll(page?: number, limit?: number): Promise<{
        items: RoleResponse[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: string): Promise<RoleResponse>;
    update(id: string, dto: UpdateRoleDto, actorId?: string): Promise<RoleResponse>;
    delete(id: string, actorId?: string): Promise<void>;
    private mapRoleResponse;
}
export declare const roleService: RoleService;
//# sourceMappingURL=role.service.d.ts.map