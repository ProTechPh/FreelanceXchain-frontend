import Navbar from "@/components/layout/navbar";
import { FooterSection } from "@/components/layout/footer-section";
import { LeaderboardContent } from "@/components/leaderboard/leaderboard-content";
import { Trophy } from "lucide-react";

export const metadata = {
  title: "Leaderboard | FreelanceXchain",
  description:
    "Explore freelancers and employers ranked by verified reviews from completed FreelanceXchain contracts.",
};

// Header section component (static, no interactivity needed)
function LeaderboardHeader() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12 text-center">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20 shadow-xs">
          <Trophy className="size-3.5 text-warning" />
          <span>Verified Marketplace Reviews</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
          Trusted marketplace participants, <br className="hidden sm:inline" />
          <span className="text-muted-foreground dark:text-muted-foreground font-semibold">
            ranked with confidence-aware ratings.
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Compare freelancers and employers using verified reviews submitted after completed
          contracts. Profiles identify ratings that also include a blockchain transaction reference.
        </p>
      </div>
    </section>
  );
}

// Main page component — shell is static, data is fetched client-side
// to avoid Cloudflare blocking Vercel build IPs during SSG.
export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="grow pt-28 sm:pt-36 pb-20">
        <LeaderboardHeader />
        <LeaderboardContent />
      </main>

      <FooterSection />
    </div>
  );
}
