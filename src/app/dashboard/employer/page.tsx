'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import Link from 'next/link';
import { projectsApi, freelancersApi, reputationApi, matchingApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useEmployerAnalytics } from '@/hooks/use-analytics';
import { AnalyticsRangeFilter } from '@/components/analytics/range-filter';
import { ProGate } from '@/components/billing/pro-gate';
import { usePlan } from '@/hooks/use-plan';
import { DEFAULT_RANGE_PRESET, getRangeLabel, resolveRange, type RangePresetId } from '@/lib/analytics-range';
import type { Project, Proposal } from '@/types';
import { reportLoadFailure } from '@/lib/report-failure';
import { DollarSign, FolderOpen, FileText, Users, Clock, ArrowUpRight, PlusCircle, Briefcase } from 'lucide-react';
import { formatAmount, formatRelativeTime, formatDate } from '@/lib/format';
import { StatsSkeleton, ListSkeleton } from '@/components/dashboard/skeletons';
import { WalletConnectBanner } from '@/components/wallet/wallet-connect-banner';
import { TourStepLink } from '@/components/onboarding/tour-step-link';
import { WalletBalanceCard } from '@/components/wallet/wallet-balance-card';

interface RecentProposalView {
  proposal: Proposal;
  projectTitle: string;
  freelancerName: string;
  rating: number | null;
  projectId: string;
}

interface RecommendedFreelancerView {
  freelancerId: string;
  name: string;
  matchScore: number;
  matchedSkills: string[];
  rating: number | null;
  totalRatings: number;
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return 'recently';
  return formatRelativeTime(iso);
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
}

export default function EmployerDashboard() {
  const currentUser = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [coreLoading, setCoreLoading] = useState(true);
  const [range, setRange] = useState<RangePresetId>(DEFAULT_RANGE_PRESET);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingProposalCount, setPendingProposalCount] = useState(0);
  const [recentProposals, setRecentProposals] = useState<RecentProposalView[]>([]);
  const [recommended, setRecommended] = useState<RecommendedFreelancerView[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(true);

  // Only analytics moves to React Query here — it is the one resource the range
  // filter refetches, and the API already caches it for 60s.
  const analyticsRange = useMemo(() => resolveRange(range, new Date()), [range]);
  const { isPro } = usePlan();
  // Free users never fire this request: the tile below renders a lock instead.
  const { data: analytics } = useEmployerAnalytics(analyticsRange, Boolean(currentUser) && isPro);
  const totalSpent = analytics?.totalSpent ?? null;
  const completedContractCount = analytics?.projectsCompleted ?? null;

  useEffect(() => {
    if (!currentUser) return;

    async function load() {
      try {
        const [projectsRes] = await Promise.allSettled([
          projectsApi.getMyProjects(),
        ]);

        let myProjects: Project[] = [];
        if (projectsRes.status === 'fulfilled') {
          myProjects = projectsRes.value.data.items;
          setProjects(myProjects);
        }

        setCoreLoading(false);
        setLoading(false);

        const openOrActive = myProjects
          .filter((p) => p.status === 'open' || p.status === 'in_progress')
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5);

        if (openOrActive.length === 0) return;

        const proposalLists = await Promise.all(
          openOrActive.map((p) => projectsApi.getProposals(p.id).then((r) => r.data.items).catch(() => []))
        );

        const allProposals = openOrActive.flatMap((project, i) =>
          proposalLists[i].map((proposal) => ({ proposal, project }))
        );
        setPendingProposalCount(allProposals.filter((p) => p.proposal.status === 'pending').length);

        const recent = allProposals
          .sort((a, b) => new Date(b.proposal.createdAt).getTime() - new Date(a.proposal.createdAt).getTime())
          .slice(0, 5);

        // Cache freelancer profile & reputation lookups to eliminate duplicate requests
        type FreelancerProfileResult = Awaited<ReturnType<typeof freelancersApi.getPublicProfile>>;
        type ReputationScoreResult = Awaited<ReturnType<typeof reputationApi.getScore>>;
        type FreelancerData = {
          profile: FreelancerProfileResult | null;
          score: ReputationScoreResult | null;
        };

        const profileScoreCache = new Map<string, Promise<FreelancerData>>();
        const getFreelancerData = (id: string): Promise<FreelancerData> => {
          const cached = profileScoreCache.get(id);
          if (cached) return cached;

          const promise = Promise.all([
            freelancersApi.getPublicProfile(id).catch(() => null),
            reputationApi.getScore(id).catch(() => null),
          ]).then(([profile, score]) => ({ profile, score }));

          profileScoreCache.set(id, promise);
          return promise;
        };

        const details = await Promise.all(
          recent.map(async ({ proposal }) => getFreelancerData(proposal.freelancerId))
        );

        setRecentProposals(
          recent.map(({ proposal, project }, i) => ({
            proposal,
            projectTitle: project.title,
            freelancerName: details[i]?.profile?.data.name ?? 'Freelancer',
            rating: details[i]?.score?.data.averageRating ?? null,
            projectId: project.id,
          }))
        );

        // Load AI recommended freelancers in background
        const loadRecommendations = async () => {
          // Pro-only: the card body below renders a lock instead.
          if (!isPro) {
            setRecommendedLoading(false);
            return;
          }
          try {
            setRecommendedLoading(true);
            const openProjectIds = openOrActive.map((p) => p.id);
            const recsResults = await Promise.allSettled(
              openProjectIds.slice(0, 2).map((id) =>
                matchingApi.getFreelancerRecommendations(id, 3).then((r) => r.data)
              )
            );
            const allRecs = recsResults
              .filter((r): r is PromiseFulfilledResult<import('@/lib/api').FreelancerRecommendation[]> => r.status === 'fulfilled')
              .flatMap((r) => r.value);
            // Deduplicate by freelancerId, keep highest matchScore
            const seen = new Map<string, import('@/lib/api').FreelancerRecommendation>();
            for (const rec of allRecs) {
              const existing = seen.get(rec.freelancerId);
              if (!existing || rec.matchScore > existing.matchScore) {
                seen.set(rec.freelancerId, rec);
              }
            }
            const uniqueRecs = Array.from(seen.values())
              .sort((a, b) => b.matchScore - a.matchScore)
              .slice(0, 3);
            if (uniqueRecs.length === 0) return;
            const profiles = await Promise.all(
              uniqueRecs.map(async (rec) => getFreelancerData(rec.freelancerId))
            );
            setRecommended(
              uniqueRecs.map((rec, i) => ({
                freelancerId: rec.freelancerId,
                name: profiles[i]?.profile?.data.name ?? 'Freelancer',
                matchScore: rec.matchScore,
                matchedSkills: rec.matchedSkills,
                rating: profiles[i]?.score?.data.averageRating ?? null,
                totalRatings: profiles[i]?.score?.data.totalRatings ?? 0,
              }))
            );
          } catch {
            // Recommendations are a background enhancement; degrade gracefully
          } finally {
            setRecommendedLoading(false);
          }
        };
        void loadRecommendations();
      } catch (error) {
        reportLoadFailure(error, 'your dashboard', () => void load());
      } finally {
        setCoreLoading(false);
        setLoading(false);
      }
    }

    void load();
    // isPro gates loadRecommendations, so an upgrade mid-session re-runs it.
  }, [currentUser, isPro]);

  if (loading) {
    return (
      <StatsSkeleton label="Loading dashboard" />
    );
  }

  const activeProjects = projects.filter((p) => p.status === 'open' || p.status === 'in_progress');

  const stats = [
    {
      title: 'Active Projects',
      value: String(activeProjects.length),
      icon: FolderOpen,
      color: 'text-primary',
      bg: 'bg-primary/10',
      loading: coreLoading,
      tour: undefined,
    },
    {
      title: range === 'all' ? 'Total Spent' : `Spent · ${getRangeLabel(range)}`,
      value: formatAmount(totalSpent),
      icon: DollarSign,
      color: 'text-success',
      bg: 'bg-success-subtle',
      loading: totalSpent === null && completedContractCount === null,
      // Named, not positional: the money tile is first for freelancers and
      // second here, and anchoring the tour by index pointed the "what you have
      // spent" step at Active Projects.
      tour: 'earnings',
      // Derived from /analytics/employer, which is Pro-only.
      pro: true,
    },
    {
      title: 'Pending Proposals',
      value: String(pendingProposalCount),
      icon: FileText,
      color: 'text-cyan',
      bg: 'bg-cyan/10',
      loading: coreLoading,
      tour: undefined,
    },
    {
      title: 'Completed Contracts',
      value: completedContractCount !== null ? String(completedContractCount) : '—',
      icon: Briefcase,
      color: 'text-warning',
      bg: 'bg-warning-subtle',
      loading: completedContractCount === null,
      tour: undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Welcome back{currentUser?.name ? `, ${currentUser.name}` : ''}!</h1>
          <p className="text-muted-foreground">Manage your projects and find talent</p>
          {/* Hidden on Free: a range control that drives a locked endpoint is
              a dead control. */}
          {isPro && (
            <AnalyticsRangeFilter
              value={range}
              onChange={setRange}
              label="Spending date range"
              className="mt-3"
            />
          )}
        </div>
        <Button asChild variant="gradient" data-tour="primary-cta" className="w-full sm:w-auto shrink-0">
          <Link href="/dashboard/employer/projects/new">
            <PlusCircle className="w-4 h-4 mr-2" /> Post Project
          </Link>
        </Button>
      </div>

      {/* Wallet Connect Banner if unlinked */}
      <WalletConnectBanner role="employer" />

      {/* Connected Wallet Balance Card */}
      <WalletBalanceCard role="employer" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} data-tour={stat.tour} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  {/* Title and the data-tour anchor stay outside the gate so the
                      onboarding tour and the tile's identity survive on Free. */}
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  {'pro' in stat && stat.pro ? (
                    <ProGate feature="employer-analytics" variant="inline">
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </ProGate>
                  ) : stat.loading ? (
                    <Skeleton className="h-7 w-20 mt-1.5 rounded-md" />
                  ) : (
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  )}
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
        {/* Active Projects */}
        <div className="lg:col-span-2">
          <Card data-tour="active-work" className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Active Projects</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/employer/projects">
                  View All <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {coreLoading ? (
                <ListSkeleton rows={2} label="Loading active projects" />
              ) : activeProjects.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No active projects yet — post one to start receiving proposals
                  </p>
                  <TourStepLink step="contracts">How contracts and milestones work</TourStepLink>
                </div>
              ) : (
                <>
                  {activeProjects.slice(0, 4).map((project) => {
                    const milestones = project.milestones ?? [];
                    const completedCount = milestones.filter((m) => m.status === 'completed').length;
                    const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
                    return (
                      <Link
                        key={project.id}
                        href={`/dashboard/employer/projects/${project.id}`}
                        className="block rounded-xl border border-border bg-secondary/50 p-4 transition-all hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium">{project.title}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span>{project.proposalCount ?? 0} proposals</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {formatDate(project.deadline)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary">{formatAmount(project.budget)}</p>
                            <StatusBadge status={project.status} domain="project" />
                          </div>
                        </div>
                        {project.status === 'in_progress' && milestones.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 bg-background rounded-full overflow-hidden">
                              <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                  {activeProjects.length > 4 && (
                    <div className="flex justify-center pt-2">
                      <Button variant="link" asChild>
                        <Link href="/dashboard/employer/projects">
                          View all ({activeProjects.length})
                        </Link>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Proposals */}
        <Card data-tour="proposals" className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Recent Proposals</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href={recentProposals.length === 1 ? `/dashboard/employer/projects/${recentProposals[0].projectId}/proposals` : "/dashboard/employer/projects"}>
                {recentProposals.length === 1 ? 'View Proposals' : 'View in Projects'} <ArrowUpRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {coreLoading ? (
              <ListSkeleton rows={2} label="Loading recent proposals" />
            ) : recentProposals.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <p className="text-sm text-muted-foreground">No proposals yet</p>
                <TourStepLink step="proposals">How bids are ranked</TourStepLink>
              </div>
            ) : (
              <>
                {recentProposals.slice(0, 4).map(({ proposal, projectTitle, freelancerName, rating, projectId }) => (
                  <Link
                    key={proposal.id}
                    href={`/dashboard/employer/projects/${projectId}/proposals`}
                    className="block p-3 rounded-xl bg-secondary/50 border border-border transition-all hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold">
                        {initials(freelancerName)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{freelancerName}</p>
                        <p className="text-xs text-muted-foreground">{projectTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-primary">{formatAmount(proposal.proposedRate)}</span>
                      {rating !== null && <span>★ {rating.toFixed(1)}</span>}
                      <span>{relativeTime(proposal.createdAt)}</span>
                    </div>
                  </Link>
                ))}
                {recentProposals.length > 4 && (
                  <div className="flex justify-center pt-2">
                    <Button variant="link" asChild>
                      <Link href="/dashboard/employer/projects">
                        View all ({recentProposals.length})
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/dashboard/employer/projects/new">
          <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium">Post New Project</p>
                <p className="text-xs text-muted-foreground">Create a project listing</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/freelancers">
          <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-cyan" />
              </div>
              <div>
                <p className="font-medium">Find Talent</p>
                <p className="text-xs text-muted-foreground">AI-powered freelancer matching</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/employer/verification">
          <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-success-subtle flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-medium">Verification</p>
                <p className="text-xs text-muted-foreground">Complete identity verification</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* AI Recommended Talent */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">AI Recommended Talent</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/freelancers">
              View All <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ProGate feature="freelancer-recommendations" variant="card">
          {recommendedLoading ? (
            <div className="grid md:grid-cols-3 gap-4" role="status" aria-label="Loading AI recommendations">
              <Skeleton className="h-44 rounded-xl" />
              <Skeleton className="h-44 rounded-xl" />
              <Skeleton className="h-44 rounded-xl" />
            </div>
          ) : recommended.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                No recommendations yet — post a project to get AI-matched with freelancers.
              </p>
              <Button asChild size="sm" variant="gradient">
                <Link href="/dashboard/employer/projects/new">Post a project →</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {recommended.map(({ freelancerId, name, matchScore, matchedSkills, rating, totalRatings }) => (
                <Link
                  key={freelancerId}
                  href={`/freelancers/${freelancerId}`}
                  className="block rounded-xl border border-border bg-secondary/50 p-4 transition-all hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold">
                        {initials(name)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{name}</p>
                        {rating !== null && totalRatings > 0 && (
                          <p className="text-xs text-muted-foreground">★ {rating.toFixed(1)} ({totalRatings})</p>
                        )}
                      </div>
                    </div>
                    <Badge className="bg-success-subtle text-success">{Math.round(matchScore)}% Match</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedSkills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {matchedSkills.length > 3 && (
                      <Badge variant="secondary" className="text-xs">+{matchedSkills.length - 3}</Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
          </ProGate>
        </CardContent>
      </Card>
    </div>
  );
}
