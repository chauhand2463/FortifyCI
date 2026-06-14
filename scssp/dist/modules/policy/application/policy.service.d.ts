import type { CreatePolicyDto, PolicyResponse, PolicyEvaluationResult } from '../domain/policy.types';
export declare class PolicyService {
    create(dto: CreatePolicyDto, userId: string): Promise<PolicyResponse>;
    findAll(): Promise<PolicyResponse[]>;
    findById(id: string): Promise<PolicyResponse>;
    update(id: string, dto: Partial<CreatePolicyDto>, userId: string): Promise<PolicyResponse>;
    delete(id: string, userId: string): Promise<void>;
    setDefault(id: string, userId: string): Promise<PolicyResponse>;
    evaluate(imageId: string, policyId?: string): Promise<PolicyEvaluationResult>;
    evaluateVulnerabilities(vulns: Array<{
        vulnerabilityId: string;
        severity: string;
        pkgName?: string;
        packageName?: string;
        fixedVersion?: string | null;
    }>, policyId?: string): Promise<PolicyEvaluationResult>;
    private mapResponse;
}
export declare const policyService: PolicyService;
//# sourceMappingURL=policy.service.d.ts.map