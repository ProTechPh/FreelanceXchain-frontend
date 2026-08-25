'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminApi, analyticsApi, reputationApi } from '@/lib/api';
import type { AdminAnalytics, SkillTrend } from '@/types';
import { toast } from 'sonner';
import { TrendingUp, Users, DollarSign, FolderOpen, Loader2, Star } from 'lucide-react';

interface LeaderboardEntry {
  userId: string;
  userName: string;
  averageRating: number;
  totalRatings: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [skillTrends, setSkillTrends] = useState<SkillTrend[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const load = useCallback(async () => {
    try {
      const [analyticsRes, skillsRes, leaderboardRes] = await Promise.allSettled([
        adminApi.getAnalytics(),
        analyticsApi.getSkillTrends(),
        reputationApi.getLeaderboard({ limit: 5 }),
      ]);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data);
      if (skillsRes.status === 'fulfilled') setSkillTrends(skillsRes.value.data.slice(0, 5));
      if (leaderboardRes.status === 'fulfilled') setLeaderboard(leaderboardRes.value.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const metrics = [
    {
      title: 'Total Revenue (platform fees)',
      value: analytics ? `$${analytics.totalRevenue.toLocaleString()}` : '—',
      icon: DollarSign,
      color: 'text-success',
      bg: 'bg-success-subtle',
    },
    {
      title: 'Total Users',
      value: analytics ? analytics.totalUsers.toLocaleString() : '—',
      change: analytics ? `+${analytics.userGrowth} last 30 days` : undefined,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Total Projects',
      value: analytics ? analytics.totalProjects.toLocaleString() : '—',
      change: analytics ? `+${analytics.projectGrowth} last 30 days` : undefined,
      icon: FolderOpen,
      color: 'text-cyan',
      bg: 'bg-cyan/10',
    },
    {
      title: 'Active Contracts',
      value: analytics ? analytics.activeContracts.toLocaleString() : '—',
      icon: TrendingUp,
      color: 'text-warning',
      bg: 'bg-warning-subtle',
    },
  ];

  const growthData = analytics?.userGrowthData ?? [];
  const maxGrowth = Math.max(1, ...growthData.map((d) => d.count));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Platform performance and insights</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold mt-1">{metric.value}</p>
                  {metric.change && <p className="text-xs text-success mt-1">{metric.change}</p>}
                </div>
                <div className={`w-10 h-10 rounded-lg ${metric.bg} flex items-center justify-center`}>
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>User Growth (last 12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            {growthData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-16 text-center">No growth data yet</p>
            ) : (
              <div className="h-64 flex items-end gap-2">
                {growthData.map((data) => (
                  <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full gradient-primary rounded-t-lg transition-all hover:opacity-80"
                      style={{ height: `${Math.max(4, (data.count / maxGrowth) * 200)}px` }}
                      title={`${data.count} new users`}
                    />
                    <span className="text-xs text-muted-foreground">{data.month.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Skills in Demand */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Top Skills in Demand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skillTrends.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">No skill data yet</p>
            )}
            {skillTrends.map((skill) => {
              const maxProjects = Math.max(1, ...skillTrends.map((s) => s.projectCount));
              return (
                <div key={skill.skillId}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{skill.skillName}</span>
                    <span className="text-muted-foreground">{skill.projectCount} projects</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-primary rounded-full"
                      style={{ width: `${(skill.projectCount / maxProjects) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Top Rated Freelancers */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>
            <span>Top Rated Freelancers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No ratings yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">#</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Freelancer</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Rating</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Total Ratings</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((freelancer, i) => (
                    <tr key={freelancer.userId} className="border-b border-border">
                      <td className="p-3">
                        <span className="font-medium text-muted-foreground">#{i + 1}</span>
                      </td>
                      <td className="p-3 font-medium">{freelancer.userName}</td>
                      <td className="p-3">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-warning" /> {freelancer.averageRating.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{freelancer.totalRatings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Badge className="mt-4 bg-muted text-muted-foreground text-xs">
            Ranked by average rating, not revenue
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
