'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Star,
  TrendingUp,
  Award,
  Globe,
  CheckCircle,
  Crown,
  Medal,
  Zap,
} from 'lucide-react';

const leaderboard = [
  {
    rank: 1,
    name: 'Sarah Chen',
    avatar: 'SC',
    title: 'UI/UX Designer',
    score: 4.95,
    reviews: 31,
    projects: 18,
    badge: 'Platinum',
    badgeColor: 'bg-purple-500/10 text-purple-500',
  },
  {
    rank: 2,
    name: 'Alex Thompson',
    avatar: 'AT',
    title: 'Blockchain Developer',
    score: 4.88,
    reviews: 24,
    projects: 12,
    badge: 'Gold',
    badgeColor: 'bg-yellow-500/10 text-yellow-500',
  },
  {
    rank: 3,
    name: 'Elena Rodriguez',
    avatar: 'ER',
    title: 'Cloud Architect',
    score: 4.82,
    reviews: 20,
    projects: 14,
    badge: 'Silver',
    badgeColor: 'bg-gray-500/10 text-gray-500',
  },
  {
    rank: 4,
    name: 'Mike Johnson',
    avatar: 'MJ',
    title: 'Smart Contract Dev',
    score: 4.75,
    reviews: 15,
    projects: 8,
    badge: 'Bronze',
    badgeColor: 'bg-orange-500/10 text-orange-500',
  },
  {
    rank: 5,
    name: 'David Kim',
    avatar: 'DK',
    title: 'Mobile Developer',
    score: 4.68,
    reviews: 22,
    projects: 16,
    badge: null,
    badgeColor: '',
  },
  {
    rank: 6,
    name: 'Lisa Wang',
    avatar: 'LW',
    title: 'Data Scientist',
    score: 4.62,
    reviews: 12,
    projects: 10,
    badge: null,
    badgeColor: '',
  },
  {
    rank: 7,
    name: 'James Wilson',
    avatar: 'JW',
    title: 'DevOps Engineer',
    score: 4.55,
    reviews: 18,
    projects: 11,
    badge: null,
    badgeColor: '',
  },
  {
    rank: 8,
    name: 'Maria Garcia',
    avatar: 'MG',
    title: 'Full Stack Dev',
    score: 4.48,
    reviews: 14,
    projects: 9,
    badge: null,
    badgeColor: '',
  },
];

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
                  {leaderboard.map((freelancer) => (
                    <Link key={freelancer.rank} href={`/freelancers/${freelancer.rank}`}>
                      <div
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                          freelancer.rank <= 3
                            ? 'bg-gradient-to-r from-primary/5 to-transparent border-primary/20'
                            : 'bg-secondary/50 border-border hover:border-primary/20'
                        }`}
                      >
                        <div className="w-10 flex justify-center">
                          {getRankIcon(freelancer.rank)}
                        </div>
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold">
                          {freelancer.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{freelancer.name}</p>
                            {freelancer.badge && (
                              <Badge className={freelancer.badgeColor}>
                                <Zap className="w-3 h-3 mr-1" /> {freelancer.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{freelancer.title}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold">{freelancer.score}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {freelancer.reviews} reviews • {freelancer.projects} projects
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Ranking */}
            <Card className="bg-card border-border overflow-hidden">
              <div className="absolute inset-0 gradient-primary opacity-5" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Your Ranking
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-2xl mb-3">
                    AT
                  </div>
                  <p className="font-semibold">Alex Thompson</p>
                  <p className="text-sm text-muted-foreground">Rank #2</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> 4.88
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Reviews</span>
                    <span className="font-semibold">24</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Projects</span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Badge</span>
                    <Badge className="bg-yellow-500/10 text-yellow-500">
                      <Zap className="w-3 h-3 mr-1" /> Gold
                    </Badge>
                  </div>
                </div>
                <Link href="/dashboard/freelancer/reputation">
                  <Button variant="outline" className="w-full mt-4">
                    View Full Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

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
