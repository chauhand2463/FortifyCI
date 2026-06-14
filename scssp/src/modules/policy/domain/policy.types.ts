export interface CreatePolicyDto {
  name: string;
  description?: string;
  blockOnCritical?: boolean;
  blockOnHigh?: boolean;
  blockOnlyFixable?: boolean;
  maxHighCount?: number;
  maxMediumCount?: number;
  slaCriticalDays?: number;
  slaHighDays?: number;
  slaMediumDays?: number;
  registryPatterns?: string[];
  isDefault?: boolean;
}

export interface PolicyResponse {
  id: string;
  name: string;
  description: string | null;
  blockOnCritical: boolean;
  blockOnHigh: boolean;
  blockOnlyFixable: boolean;
  maxHighCount: number;
  maxMediumCount: number;
  slaCriticalDays: number;
  slaHighDays: number;
  slaMediumDays: number;
  registryPatterns: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyEvaluationResult {
  passed: boolean;
  reason: string;
  blockingCVEs: { vulnerabilityId: string; severity: string; pkgName?: string; fixedVersion?: string }[];
  policyName: string;
}
