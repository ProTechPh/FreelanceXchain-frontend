'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { reputationApi } from '@/lib/api';
import type { ReputationScore } from '@/types';
import { toast } from 'sonner';
import {
  Trophy,
  Star,
  Award,
  Globe,
  CheckCircle,
  Crown,
  Medal,
  Zap,
  Loader2,
} from 'lucide-react';

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Medal className="w-5 h-5 text-orange-400" />;
    default:
      return <span className="text-muted-foreground font-medium w-5 text-center">#{rank}</span>;
  }
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<ReputationScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await reputationApi.getLeaderboard();
        setLeaderboard(res.data.data);
      } catch {
        toast.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground">
            Top freelancers ranked by on-chain reputation scores
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Leaderboard */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" /> Top Freelancers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <Link key={entry.user_id} href={`/freelancers/${entry.user_id}`}>
                      <div
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                          index < 3
                            ? 'bg-gradient-to-r from-primary/5 to-transparent border-primary/20'
                            : 'bg-secondary/50 border-border hover:border-primary/20'
                        }`}
                      >
                        <div className="w-10 flex justify-center">
                          {getRankIcon(index + 1)}
                        </div>
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold">
                          {(index + 1).toString()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">User {entry.user_id.slice(0, 8)}</p>
                            {index === 0 && (
                              <Badge className="bg-purple-500/10 text-purple-500">
                                <Zap className="w-3 h-3 mr-1" /> Platinum
                              </Badge>
                            )}
                            {index === 1 && (
                              <Badge className="bg-yellow-500/10 text-yellow-500">
                                <Zap className="w-3 h-3 mr-1" /> Gold
                              </Badge>
                            )}
                            {index === 2 && (
                              <Badge className="bg-gray-500/10 text-gray-500">
                                <Zap className="w-3 h-3 mr-1" /> Silver
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {entry.total_ratings} reviews
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold">{entry.overall_score.toFixed(2)}</span>
                          </div>
                          {entry.on_chain_verified && (
                            <p className="text-xs text-green-500 flex items-center gap-1 justify-end">
                              <CheckCircle className="w-3 h-3" /> Verified
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                  {leaderboard.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No rankings available yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reputation Tiers */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Reputation Tiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { tier: 'Platinum', min: '4.9+', color: 'bg-purple-500', perks: 'Top 1%' },
                  { tier: 'Gold', min: '4.7+', color: 'bg-yellow-500', perks: 'Top 5%' },
                  { tier: 'Silver', min: '4.5+', color: 'bg-gray-400', perks: 'Top 15%' },
                  { tier: 'Bronze', min: '4.0+', color: 'bg-orange-400', perks: 'Top 30%' },
                ].map((tier) => (
                  <div
                    key={tier.tier}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{tier.tier}</p>
                      <p className="text-xs text-muted-foreground">{tier.perks}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{tier.min}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* How Rankings Work */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>How Rankings Work</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Rankings are based on on-chain reputation scores that consider:
                </p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" /> Project completion rate
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" /> Client reviews & ratings
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" /> Work quality scores
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" /> Communication ratings
                  </li>
                  <li className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" /> All data verified on-chain
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
