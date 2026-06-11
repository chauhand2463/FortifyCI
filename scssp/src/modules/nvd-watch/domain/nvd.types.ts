export interface NvdWatchStatus {
  lastSyncAt: string | null;
  cvesProcessed24h: number;
  rescansTriggered24h: number;
  isRunning: boolean;
}

export interface CveWatchResponse {
  id: string;
  cveId: string;
  publishedAt: string;
  severity: string;
  cvssScore: number | null;
  affectedImages: string[];
  rescanCount: number;
  processed: boolean;
  processedAt: string | null;
  createdAt: string;
}
