export interface CreateAssignmentDto {
  vulnerabilityId: string;
  assignedToId: string;
  notes?: string;
}

export interface UpdateAssignmentStatusDto {
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED_RISK' | 'FALSE_POSITIVE';
}

export interface AssignmentResponse {
  id: string;
  vulnerabilityId: string;
  cveId: string;
  severity: string;
  assignedTo: { id: string; username: string; email: string };
  assignedBy: { id: string; username: string };
  status: string;
  slaDeadline: string;
  slaBreached: boolean;
  slaBreachedAt: string | null;
  resolvedAt: string | null;
  resolvingScanId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceReport {
  totalAssignments: number;
  breachedCount: number;
  mttrSeconds: number;
  acceptedRiskCount: number;
  falsePositiveCount: number;
  agingVulnerabilities: { days: number; count: number }[];
  byStatus: Record<string, number>;
}
