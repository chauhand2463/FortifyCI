export interface CreateLiveScanDto {
  imageRef: string;
  policyId?: string;
  registryCredentials?: { username: string; password: string; serverAddress?: string };
}

export interface LiveScanResponse {
  id: string;
  imageRef: string;
  status: string;
  progress: number;
  passed: boolean | null;
  blockingReason: string | null;
  downloadUrl: string | null;
  downloadExpiry: string | null;
  createdAt: string;
  completedAt: string | null;
}
