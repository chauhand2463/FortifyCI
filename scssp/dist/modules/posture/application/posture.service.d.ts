import type { PostureSnapshot, OrgTrendPoint, LeaderboardEntry, WeeklyDigest } from '../domain/posture.types';
export declare class PostureService {
    computeSnapshot(scanId: string): Promise<void>;
    getOrgTrend(dateFrom?: string, dateTo?: string): Promise<OrgTrendPoint[]>;
    getImageHistory(imageId: string): Promise<PostureSnapshot[]>;
    getLeaderboard(): Promise<{
        best: LeaderboardEntry[];
        worst: LeaderboardEntry[];
        mostImproved: LeaderboardEntry[];
    }>;
    getWeeklyDigest(): Promise<WeeklyDigest>;
    private countSuppressedForImage;
}
export declare const postureService: PostureService;
//# sourceMappingURL=posture.service.d.ts.map