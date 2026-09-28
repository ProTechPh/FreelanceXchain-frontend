import type { ReputationLeaderboardEntry, UserRole } from '@/types';

export type LeaderboardRole = Extract<UserRole, 'freelancer' | 'employer'>;
export type LeaderboardSort = 'overall' | 'reviews';

export function getLeaderboardProfileRoute(role: LeaderboardRole, userId: string): string {
  return role === 'employer' ? `/employers/${userId}` : `/freelancers/${userId}`;
}

export function sortLeaderboard(
  entries: ReputationLeaderboardEntry[],
  sort: LeaderboardSort,
): ReputationLeaderboardEntry[] {
  return [...entries].sort((a, b) =>
    sort === 'reviews'
      ? b.totalRatings - a.totalRatings || b.rankingScore - a.rankingScore
      : b.rankingScore - a.rankingScore || b.totalRatings - a.totalRatings,
  );
}
