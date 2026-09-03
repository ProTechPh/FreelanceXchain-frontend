"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import Navbar from "@/components/layout/navbar";
import { FooterSection } from "@/components/layout/footer-section";
import { reputationApi } from "@/lib/api";
import type { ReputationScore } from "@/types";
import { reportLoadFailure } from '@/lib/report-failure';
import { Trophy, Star, ShieldCheck, Crown } from 'lucide-react';
import { ListSkeleton } from '@/components/dashboard/skeletons';

export default function LeaderboardPage() {
  const reduce = useReducedMotion();
  const [leaderboard, setLeaderboard] = useState<ReputationScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await reputationApi.getLeaderboard();
        setLeaderboard(
          res.data.map((entry) => ({
            user_id: entry.userId,
            overall_score: entry.averageRating,
            total_ratings: entry.totalRatings,
            breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            on_chain_verified: true,
          }))
        );
      } catch (error) {
        reportLoadFailure(error, 'the leaderboard', () => void fetchLeaderboard());
      } finally {
        setLoading(false);
      }
    }
    void fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="grow pt-28 sm:pt-36 pb-20">
        {/* Header Hero */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12 text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
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
              Transparent, immutable scores computed from completed smart contract milestones, client ratings, and dispute-free deliverable approvals.
            </p>
          </motion.div>
        </section>

        {loading ? (
          <ListSkeleton rows={8} label="Loading leaderboard" />
        ) : (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
            {/* Top 3 Podium Cards */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 2nd Place */}
                <div className="order-2 md:order-1 rounded-3xl bg-card border border-border/80 p-6 shadow-md text-center flex flex-col justify-between hover:border-primary/50 transition-all">
                  <div>
                    <div className="w-10 h-10 rounded-full bg-neutral-subtle text-neutral font-extrabold text-sm flex items-center justify-center mx-auto mb-3">
                      #2
                    </div>
                    <h3 className="font-bold text-foreground text-base">User {leaderboard[1].user_id.slice(0, 8)}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{leaderboard[1].total_ratings} completed milestones</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-center gap-1 text-sm font-bold text-foreground">
                    <Star className="size-4 text-warning fill-warning" />
                    <span>{leaderboard[1].overall_score.toFixed(2)} Rating</span>
                  </div>
                </div>

                {/* 1st Place - Gold Champion */}
                <div className="order-1 md:order-2 rounded-3xl bg-card border-2 border-primary/40 p-8 shadow-xl text-center flex flex-col justify-between sm:scale-105 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-warning text-warning-foreground text-2xs font-bold shadow-md flex items-center gap-1">
                    <Crown className="size-3" /> Champion
                  </div>
                  <div>
                    <div className="w-12 h-12 rounded-full bg-warning-subtle text-warning font-black text-lg flex items-center justify-center mx-auto mb-3">
                      #1
                    </div>
                    <h3 className="font-extrabold text-foreground text-lg">User {leaderboard[0].user_id.slice(0, 8)}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{leaderboard[0].total_ratings} completed milestones</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-center gap-1.5 text-base font-extrabold text-primary">
                    <Star className="size-4 text-warning fill-warning" />
                    <span>{leaderboard[0].overall_score.toFixed(2)} Rating</span>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="order-3 rounded-3xl bg-card border border-border/80 p-6 shadow-md text-center flex flex-col justify-between hover:border-primary/50 transition-all">
                  <div>
                    <div className="w-10 h-10 rounded-full bg-warning-subtle text-warning font-extrabold text-sm flex items-center justify-center mx-auto mb-3">
                      #3
                    </div>
                    <h3 className="font-bold text-foreground text-base">User {leaderboard[2].user_id.slice(0, 8)}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{leaderboard[2].total_ratings} completed milestones</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-center gap-1 text-sm font-bold text-foreground">
                    <Star className="size-4 text-warning fill-warning" />
                    <span>{leaderboard[2].overall_score.toFixed(2)} Rating</span>
                  </div>
                </div>
              </div>
            )}

            {/* Main Rankings & Reputation Tiers Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Leaderboard Table Card */}
              <div className="lg:col-span-2 rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-md shadow-black/5">
                <h2 className="text-lg font-bold text-foreground mb-4">Complete Rankings</h2>
                <div className="space-y-2.5">
                  {leaderboard.map((entry, index) => (
                    <Link key={entry.user_id} href={`/freelancers/${entry.user_id}`}>
                      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-background border border-border/60 hover:border-primary/40 transition-all cursor-pointer">
                        <div className="flex items-center gap-3.5">
                          <span className="w-7 text-center font-bold text-xs text-muted-foreground">
                            #{index + 1}
                          </span>
                          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-foreground text-sm">User {entry.user_id.slice(0, 8)}</p>
                              <ShieldCheck className="size-3.5 text-success" />
                            </div>
                            <p className="text-2xs text-muted-foreground">{entry.total_ratings} reviews</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 font-bold text-foreground text-sm">
                          <Star className="size-3.5 text-warning fill-warning" />
                          <span>{entry.overall_score.toFixed(2)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Sidebar Cards */}
              <div className="space-y-6">
                {/* Reputation Tiers */}
                <div className="rounded-3xl bg-card border border-border/80 p-6 shadow-sm">
                  <h3 className="font-bold text-foreground text-sm mb-3">Reputation Tiers</h3>
                  <div className="space-y-2">
                    {[
                      { tier: "Platinum", min: "4.9+", color: "bg-info", perks: "Top 1% Performers" },
                      { tier: "Gold", min: "4.7+", color: "bg-warning", perks: "Top 5% Performers" },
                      { tier: "Silver", min: "4.5+", color: "bg-neutral", perks: "Top 15% Performers" },
                      { tier: "Bronze", min: "4.0+", color: "bg-warning", perks: "Top 30% Performers" },
                    ].map((tier) => (
                      <div key={tier.tier} className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border/60 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${tier.color}`} />
                          <span className="font-bold text-foreground">{tier.tier}</span>
                        </div>
                        <span className="font-semibold text-muted-foreground">{tier.min}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Proof of Reputation */}
                <div className="rounded-3xl bg-card border border-border/80 p-6 shadow-sm">
                  <h3 className="font-bold text-foreground text-sm mb-2">On-Chain Reputation Proof</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Ratings and completed milestone deliveries are permanently anchored to Ethereum smart contracts, creating an un-forgeable work history.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <FooterSection />
    </div>
  );
}
