export interface PostureSnapshot {
  id: string;
  imageId: string;
  imageRef: string;
  scanId: string;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  fixableCount: number;
  suppressedCount: number;
  postureScore: number;
  snapshotAt: string;
}

export interface OrgTrendPoint {
  date: string;
  score: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface LeaderboardEntry {
  imageId: string;
  imageRef: string;
  averageScore: number;
  scanCount: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface WeeklyDigest {
  orgScore: number;
  scoreTrend: 'up' | 'down' | 'stable';
  topRegressions: { scanId: string; imageRef: string; deltaScore: number }[];
  slaBreaches: number;
}
