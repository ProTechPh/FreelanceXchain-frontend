import { Suspense } from "react";
import Navbar from "@/components/layout/navbar";
import { FooterSection } from "@/components/layout/footer-section";
import { LeaderboardContent } from "@/components/leaderboard/leaderboard-content";
import { ListSkeleton } from "@/components/dashboard/skeletons";
import { Trophy } from "lucide-react";
import type { ReputationLeaderboardEntry } from "@/types";

export const metadata = {
  title: "Leaderboard | FreelanceXchain",
  description:
    "Top rated freelancers and engineers ranked by on-chain reputation. Transparent, immutable scores from completed smart contract milestones.",
};

// Server-side data fetching
async function fetchLeaderboard(): Promise<ReputationLeaderboardEntry[]> {
  try {
    const backendBase = (process.env.BACKEND_API_URL || 'https://api.freelancexchain.works').replace(/\/+$/, '');
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = rawApiUrl && rawApiUrl.startsWith('http') ? rawApiUrl : `${backendBase}/api`;

    const headers: Record<string, string> = {};
    if (process.env.INTERNAL_API_SECRET) {
      headers['x-internal-secret'] = process.env.INTERNAL_API_SECRET;
    }

    const res = await fetch(`${apiUrl}/reputation/leaderboard`, {
      headers,
      // Revalidate every 5 minutes since leaderboard data changes
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch leaderboard: ${res.status}`);
    }

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

// Header section component (static, no interactivity needed)
function LeaderboardHeader() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12 text-center">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20 shadow-xs">
          <Trophy className="size-3.5 text-warning" />
          <span>On-Chain Verified Rankings</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
          Top Rated Freelancers & Engineers, <br className="hidden sm:inline" />
          <span className="text-muted-foreground dark:text-muted-foreground font-semibold">
            ranked by on-chain reputation.
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Transparent, immutable scores computed from completed smart contract milestones, client
          ratings, and dispute-free deliverable approvals.
        </p>
      </div>
    </section>
  );
}

// Main page component (Server Component)
export default async function LeaderboardPage() {
  const leaderboard = await fetchLeaderboard();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="grow pt-28 sm:pt-36 pb-20">
        <LeaderboardHeader />

        <Suspense fallback={<ListSkeleton rows={8} label="Loading leaderboard" />}>
          <LeaderboardContent leaderboard={leaderboard} />
        </Suspense>
      </main>

      <FooterSection />
    </div>
  );
}
