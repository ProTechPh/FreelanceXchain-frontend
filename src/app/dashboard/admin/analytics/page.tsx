'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminApi, analyticsApi, reputationApi } from '@/lib/api';
import type { AdminAnalytics, SkillTrend, MarketplaceLiquidityReport, FunnelMetricsReport } from '@/types';
import { reportLoadFailure } from '@/lib/report-failure';
import {
  TrendingUp,
  Users,
  DollarSign,
  FolderOpen,
  Star,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Zap,
  RefreshCw,
  Filter,
  ArrowDownRight,
  Layers,
} from 'lucide-react';
import { StatsSkeleton } from '@/components/dashboard/skeletons';
import { formatAmount, formatNumber } from '@/lib/format';

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
  const [liquidity, setLiquidity] = useState<MarketplaceLiquidityReport | null>(null);
  const [funnel, setFunnel] = useState<FunnelMetricsReport | null>(null);

  const load = useCallback(async () => {
    const [analyticsRes, skillsRes, leaderboardRes, liquidityRes, funnelRes] = await Promise.allSettled([
      adminApi.getAnalytics(),
      analyticsApi.getSkillTrends(),
      reputationApi.getLeaderboard({ limit: 5 }),
      analyticsApi.getLiquidityReport(),
      analyticsApi.getFunnelMetrics(),
    ]);
    if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data);
    if (skillsRes.status === 'fulfilled') setSkillTrends(skillsRes.value.data.slice(0, 5));
    if (leaderboardRes.status === 'fulfilled') setLeaderboard(leaderboardRes.value.data);
    if (liquidityRes.status === 'fulfilled') setLiquidity(liquidityRes.value.data);
    if (funnelRes.status === 'fulfilled') setFunnel(funnelRes.value.data);
  }, []);

  // Reported here rather than inside the loader so the toast's Retry can
  // call it again; a self-reference inside the callback is not allowed.
  useEffect(() => {
    let active = true;
    function run() {
      load()
        .catch((error) => {
          if (active) reportLoadFailure(error, 'analytics', run);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    run();
    return () => {
      active = false;
    };
  }, [load]);

  if (loading) {
    return (
      <StatsSkeleton label="Loading analytics" />
    );
  }

  const gmv = analytics?.grossMarketplaceVolume ?? (analytics ? analytics.totalRevenue * 20 : 0);

  const metrics = [
    {
      title: 'Gross Marketplace Volume (GMV)',
      value: analytics ? formatAmount(gmv) : '—',
      description: 'Total completed milestone value',
      icon: DollarSign,
      color: 'text-success',
      bg: 'bg-success-subtle',
    },
    {
      title: 'Total Users',
      value: analytics ? formatNumber(analytics.totalUsers) : '—',
      change: analytics ? `+${analytics.userGrowth} last 30 days` : undefined,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Total Projects',
      value: analytics ? formatNumber(analytics.totalProjects) : '—',
      change: analytics ? `+${analytics.projectGrowth} last 30 days` : undefined,
      icon: FolderOpen,
      color: 'text-cyan',
      bg: 'bg-cyan/10',
    },
    {
      title: 'Active Contracts',
      value: analytics ? formatNumber(analytics.activeContracts) : '—',
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
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Platform performance and marketplace insights</p>
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

      {/* Executive Operational KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Escrow Funding Rate</span>
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold mt-1">
              {analytics?.escrowFundingRate !== undefined ? `${analytics.escrowFundingRate}%` : '—'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Contracts funded</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Repeat Employer Rate</span>
              <RefreshCw className="w-4 h-4 text-success" />
            </div>
            <p className="text-xl font-bold mt-1">
              {analytics?.repeatEmployerRate !== undefined ? `${analytics.repeatEmployerRate}%` : '—'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">&ge; 2 completed hires</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Rush Upgrade Rate</span>
              <Zap className="w-4 h-4 text-warning" />
            </div>
            <p className="text-xl font-bold mt-1">
              {analytics?.rushUpgradeAdoptionRate !== undefined ? `${analytics.rushUpgradeAdoptionRate}%` : '—'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Expedited contracts</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Rush Fee Revenue</span>
              <DollarSign className="w-4 h-4 text-accent" />
            </div>
            <p className="text-xl font-bold mt-1">
              {analytics?.rushFeeRevenue !== undefined ? `${analytics.rushFeeRevenue.toFixed(2)} ETH` : '—'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">10% platform take</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Funnel Conversion</span>
              <Layers className="w-4 h-4 text-cyan" />
            </div>
            <p className="text-xl font-bold mt-1">
              {funnel ? `${funnel.overallConversionRate}%` : '—'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Register to complete</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Acquisition & Marketplace Conversion Funnel */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <span>Customer Acquisition & Marketplace Conversion Funnel</span>
              {funnel && (
                <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
                  {funnel.totalRegistered} Registered Users
                </Badge>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              8-stage lifecycle pipeline tracking onboarding, activation, escrow funding, and repeat contract retention.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {!funnel || funnel.stages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No funnel data available yet</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {funnel.stages.map((st, idx) => (
                  <div key={st.stage} className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {st.label}
                      </span>
                      <span className="font-mono font-bold text-foreground text-sm">{formatNumber(st.count)}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>Overall: {st.overallRate}%</span>
                        {idx > 0 && <span>Step Conv: {st.conversionRate}%</span>}
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full gradient-primary rounded-full transition-all"
                          style={{ width: `${Math.max(2, st.overallRate)}%` }}
                        />
                      </div>
                    </div>

                    {idx > 0 && st.dropoffCount > 0 && (
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                        <span className="flex items-center gap-1 text-destructive/80">
                          <ArrowDownRight className="w-3 h-3" /> Drop-off
                        </span>
                        <span>-{formatNumber(st.dropoffCount)} ({st.dropoffRate}%)</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Protocol Economics & Take-Rate Transparency */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Take-Rate Model: Decentralized 0% Escrow Fee</span>
              <Badge className="bg-success/15 text-success border-success/30 text-xs">Anti-Upwork Mode Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              100% of escrow payments are disbursed directly to freelancers. Protocol monetization is powered by rush upgrade fees and value-added features.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Realized Rush Fee Cut</span>
              <span className="font-semibold text-success">{analytics?.realizedRevenue ? formatAmount(analytics.realizedRevenue) : '0.00 ETH'}</span>
            </div>
            <div className="border-l border-border pl-6">
              <span className="text-xs text-muted-foreground block">Projected 5% Benchmark</span>
              <span className="font-semibold text-foreground">{analytics ? formatAmount(analytics.totalRevenue) : '—'}</span>
            </div>
            <div className="border-l border-border pl-6">
              <span className="text-xs text-muted-foreground block">Community Savings vs 20%</span>
              <span className="font-semibold text-primary">{formatAmount(gmv * 0.20)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

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
              <div className="overflow-x-auto">
                <div
                  className="h-64 flex items-end gap-2"
                  role="img"
                  aria-label={`User growth chart: ${growthData.map((d) => `${d.month}: ${d.count} users`).join(', ')}`}
                >
                  {growthData.map((data) => (
                    <div key={data.month} className="flex-1 min-w-8 flex flex-col items-center gap-2">
                      <div
                        className="w-full gradient-primary rounded-t-lg transition-all hover:opacity-80"
                        style={{ height: `${Math.max(4, (data.count / maxGrowth) * 200)}px` }}
                        title={`${data.count} new users`}
                      />
                      <span className="text-xs text-muted-foreground">{data.month.slice(5)}</span>
                    </div>
                  ))}
                </div>
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

      {/* Marketplace Liquidity & Talent-to-Demand Ratio (TDLR) */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>Marketplace Liquidity & Talent Supply/Demand</span>
              {liquidity && (
                <Badge className={liquidity.overallLiquidityScore >= 70 ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}>
                  {liquidity.overallLiquidityScore}% Balanced
                </Badge>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Monitors Talent-to-Demand Liquidity Ratio (TDLR) to identify skill shortages and talent surpluses.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {!liquidity || liquidity.skillsAnalyzed === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No liquidity data available yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Skill</th>
                    <th className="text-center p-3 text-sm font-medium text-muted-foreground">Projects (Demand)</th>
                    <th className="text-center p-3 text-sm font-medium text-muted-foreground">Talent (Supply)</th>
                    <th className="text-center p-3 text-sm font-medium text-muted-foreground">TDLR Ratio</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Liquidity Status</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...liquidity.shortageSkills,
                    ...liquidity.balancedSkills.slice(0, 5),
                    ...liquidity.surplusSkills.slice(0, 3),
                  ].slice(0, 10).map((metric) => (
                    <tr key={metric.skillName} className="border-b border-border text-sm">
                      <td className="p-3 font-medium">{metric.skillName}</td>
                      <td className="p-3 text-center">{metric.projectDemandCount}</td>
                      <td className="p-3 text-center">{metric.talentSupplyCount}</td>
                      <td className="p-3 text-center font-mono">{metric.talentToDemandRatio.toFixed(2)}x</td>
                      <td className="p-3">
                        {metric.liquidityStatus === 'shortage' && (
                          <Badge className="bg-destructive/15 text-destructive border-destructive/30 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Supply Deficit
                          </Badge>
                        )}
                        {metric.liquidityStatus === 'balanced' && (
                          <Badge className="bg-success/15 text-success border-success/30 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Healthy Zone
                          </Badge>
                        )}
                        {metric.liquidityStatus === 'surplus' && (
                          <Badge className="bg-muted text-muted-foreground w-fit">
                            Talent Surplus
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{metric.actionRecommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
