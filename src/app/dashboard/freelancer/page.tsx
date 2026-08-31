'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  contractsApi,
  proposalsApi,
  matchingApi,
  projectsApi,
  reputationApi,
} from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useFreelancerAnalytics } from '@/hooks/use-analytics';
import { AnalyticsRangeFilter } from '@/components/analytics/range-filter';
import { DEFAULT_RANGE_PRESET, getRangeLabel, resolveRange, type RangePresetId } from '@/lib/analytics-range';
import type { Contract, Proposal, Project } from '@/types';
import { reportLoadFailure } from '@/lib/report-failure';
import { DollarSign, FolderOpen, FileText, Star, TrendingUp, Clock, ArrowUpRight, Briefcase, Wallet } from 'lucide-react';
import { formatAmount, formatNumber, formatRelativeTime } from '@/lib/format';
import { StatsSkeleton } from '@/components/dashboard/skeletons';
import { WalletConnectBanner } from '@/components/wallet/wallet-connect-banner';
import { WalletBalanceCard } from '@/components/wallet/wallet-balance-card';

const statusColors: Record<string, string> = {
  pending: 'bg-warning-subtle text-warning',
  accepted: 'bg-success-subtle text-success',
  rejected: 'bg-destructive-subtle text-destructive',
  withdrawn: 'bg-muted text-muted-foreground',
};

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return 'recently';
  return formatRelativeTime(iso);
}

interface ActiveContractView {
  contract: Contract;
  project: Project | null;
}

interface RecentProposalView {
  proposal: Proposal;
  project: Project | null;
}

interface RecommendedProjectView {
  project: Project;
  matchScore: number;
  matchedSkills: string[];
}

export default function FreelancerDashboard() {
  const currentUser = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangePresetId>(DEFAULT_RANGE_PRESET);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [activeContracts, setActiveContracts] = useState<ActiveContractView[]>([]);
  const [pendingProposalCount, setPendingProposalCount] = useState(0);
  const [recentProposals, setRecentProposals] = useState<RecentProposalView[]>([]);
  const [recommended, setRecommended] = useState<RecommendedProjectView[]>([]);

  // Analytics is the one resource on this page that moved to React Query: it is the
  // only one that refetches on a user action (the range filter), and the API caches
  // it for 60s, so a client cache keyed on the range avoids re-requesting a value
  // the server would only serve from its own cache anyway.
  const analyticsRange = useMemo(() => resolveRange(range, new Date()), [range]);
  const { data: analytics } = useFreelancerAnalytics(analyticsRange, Boolean(currentUser));
  const totalEarnings = analytics?.totalEarnings ?? null;
  const projectsCompleted = analytics?.projectsCompleted ?? null;

  useEffect(() => {
    if (!currentUser) return;

    const load = async () => {
      try {
        const [contractsRes, proposalsRes, recommendationsRes, reputationRes] =
          await Promise.allSettled([
            contractsApi.list(),
            proposalsApi.getMine(),
            matchingApi.getProjectRecommendations(3),
            reputationApi.getScore(currentUser.id),
          ]);

        if (reputationRes.status === 'fulfilled') {
          setAverageRating(reputationRes.value.data.averageRating);
          setTotalRatings(reputationRes.value.data.totalRatings);
        }

        const projectIdsToFetch = new Set<string>();

        let activeContractsList: Contract[] = [];
        if (contractsRes.status === 'fulfilled') {
          activeContractsList = contractsRes.value.data.items.filter((c) => c.status === 'active');
          activeContractsList.forEach((c) => projectIdsToFetch.add(c.projectId));
        }

        let recentProposalsList: Proposal[] = [];
        if (proposalsRes.status === 'fulfilled') {
          const all = proposalsRes.value.data;
          setPendingProposalCount(all.filter((p) => p.status === 'pending').length);

          recentProposalsList = all
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3);
          recentProposalsList.forEach((p) => projectIdsToFetch.add(p.projectId));
        }

        let recsList: Array<{ projectId: string; matchScore: number; matchedSkills: string[] }> = [];
        if (recommendationsRes.status === 'fulfilled') {
          recsList = recommendationsRes.value.data;
          recsList.forEach((r) => projectIdsToFetch.add(r.projectId));
        }

        const projectMap = new Map<string, Project | null>();
        if (projectIdsToFetch.size > 0) {
          await Promise.all(
            Array.from(projectIdsToFetch).map(async (projectId) => {
              try {
                const res = await projectsApi.get(projectId);
                projectMap.set(projectId, res.data);
              } catch {
                projectMap.set(projectId, null);
              }
            })
          );
        }

        setActiveContracts(
          activeContractsList.map((contract) => ({
            contract,
            project: projectMap.get(contract.projectId) ?? null,
          }))
        );

        setRecentProposals(
          recentProposalsList.map((proposal) => ({
            proposal,
            project: projectMap.get(proposal.projectId) ?? null,
          }))
        );

        setRecommended(
          recsList
            .map((r) => ({
              project: projectMap.get(r.projectId) ?? null,
              matchScore: r.matchScore,
              matchedSkills: r.matchedSkills,
            }))
            .filter((r): r is RecommendedProjectView => r.project !== null)
        );
      } catch (error) {
        reportLoadFailure(error, 'your dashboard', () => void load());
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [currentUser]);

  if (loading) {
    return (
      <StatsSkeleton label="Loading dashboard" />
    );
  }

  const stats = [
    {
      title: range === 'all' ? 'Total Earned' : `Earned · ${getRangeLabel(range)}`,
      value: formatAmount(totalEarnings),
      change: projectsCompleted != null ? `${formatNumber(projectsCompleted)} completed contracts` : undefined,
      icon: DollarSign,
      color: 'text-success',
      bg: 'bg-success-subtle',
    },
    {
      title: 'Active Contracts',
      value: String(activeContracts.length),
      change: undefined,
      icon: FolderOpen,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Pending Proposals',
      value: String(pendingProposalCount),
      change: undefined,
      icon: FileText,
      color: 'text-cyan',
      bg: 'bg-cyan/10',
    },
    {
      title: 'Reputation Score',
      value: averageRating !== null && totalRatings > 0 ? averageRating.toFixed(1) : 'Not yet rated',
      change: totalRatings > 0 ? `${totalRatings} ratings` : undefined,
      icon: Star,
      color: 'text-warning',
      bg: 'bg-warning-subtle',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Welcome back{currentUser?.name ? `, ${currentUser.name}` : ''}!</h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your work</p>
          <AnalyticsRangeFilter
            value={range}
            onChange={setRange}
            label="Earnings date range"
            className="mt-3"
          />
        </div>
        <Link href="/dashboard/freelancer/projects" className="shrink-0">
          <Button variant="gradient" className="w-full sm:w-auto">
            <Briefcase className="w-4 h-4 mr-2" /> Browse Projects
          </Button>
        </Link>
      </div>

      {/* Wallet Connect Banner if unlinked */}
      <WalletConnectBanner role="freelancer" />

      {/* Connected Wallet Balance Card */}
      <WalletBalanceCard role="freelancer" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  {stat.change && <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>}
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Contracts */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Active Contracts</CardTitle>
              <Link href="/dashboard/freelancer/contracts">
                <Button variant="ghost" size="sm">
                  View All <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeContracts.length === 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No active contracts yet — browse projects to get started
                </p>
              )}
              {activeContracts.map(({ contract, project }) => {
                const milestones = project?.milestones ?? [];
                const completedCount = milestones.filter((m) => m.status === 'completed').length;
                const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
                const currentMilestone = milestones.find((m) => m.status !== 'completed');
                return (
                  <Link
                    key={contract.id}
                    href={`/dashboard/freelancer/contracts/${contract.id}`}
                    className="block rounded-xl border border-border bg-secondary/50 p-4 transition-all hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">{project?.title ?? 'Untitled project'}</p>
                        <p className="text-sm text-muted-foreground">{project?.employer?.name ?? project?.employer?.companyName ?? ''}</p>
                      </div>
                      <p className="font-semibold text-primary">${contract.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{currentMilestone?.title ?? 'All milestones complete'}</span>
                          <span className="text-muted-foreground">{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-background rounded-full overflow-hidden">
                          <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      {project?.deadline && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(project.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Recent Proposals */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Recent Proposals</CardTitle>
            <Link href="/dashboard/freelancer/proposals">
              <Button variant="ghost" size="sm">
                View All <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProposals.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">No proposals yet</p>
            )}
            {recentProposals.map(({ proposal, project }) => (
              <div key={proposal.id} className="p-3 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-sm">{project?.title ?? 'Untitled project'}</p>
                  <Badge className={statusColors[proposal.status]}>{proposal.status}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{proposal.proposedRate.toLocaleString()} ETH</span>
                  <span>{relativeTime(proposal.createdAt)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Projects */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">AI Recommended Projects</CardTitle>
          <Link href="/dashboard/freelancer/recommendations">
            <Button variant="ghost" size="sm">
              View All <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recommended.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                No recommendations yet — add skills to your profile to get AI-matched with projects.
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/freelancer/profile">Set up skills →</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {recommended.map(({ project, matchScore, matchedSkills }) => (
                <Link
                  key={project.id}
                  href={`/dashboard/freelancer/projects/${project.id}`}
                  className="block rounded-xl border border-border bg-secondary/50 p-4 transition-all hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium">{project.title}</h3>
                    <Badge className="bg-success-subtle text-success">{Math.round(matchScore)}% Match</Badge>
                  </div>
                  <p className="text-sm text-primary font-medium mb-2">${project.budget.toLocaleString()}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {matchedSkills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{relativeTime(project.createdAt)}</span>
                    <span>{project.proposalCount ?? 0} proposals</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/dashboard/freelancer/earnings">
          <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-success-subtle flex items-center justify-center">
                <Wallet className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-medium">View Earnings</p>
                <p className="text-xs text-muted-foreground">Check your wallet & transactions</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/freelancer/reputation">
          <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-warning-subtle flex items-center justify-center">
                <Star className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="font-medium">Build Reputation</p>
                <p className="text-xs text-muted-foreground">Check your on-chain ratings</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/freelancer/portfolio">
          <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Update Portfolio</p>
                <p className="text-xs text-muted-foreground">Showcase your best work</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
