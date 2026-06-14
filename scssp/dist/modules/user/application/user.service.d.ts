import type { CreateUserDto, UpdateUserDto, UserQueryDto, UserResponse, PaginatedUsers } from '../domain/user.types';
export declare class UserService {
    create(dto: CreateUserDto, actorId?: string): Promise<UserResponse>;
    findAll(query: UserQueryDto): Promise<PaginatedUsers>;
    findById(id: string): Promise<UserResponse>;
    update(id: string, dto: UpdateUserDto, actorId?: string): Promise<UserResponse>;
    delete(id: string, actorId?: string): Promise<void>;
    private mapUserResponse;
}
export declare const userService: UserService;
//# sourceMappingURL=user.service.d.ts.map