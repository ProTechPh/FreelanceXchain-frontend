import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard | FreelanceXchain',
  description: 'See the top-rated freelancers and employers on FreelanceXchain ranked by reputation score.',
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
