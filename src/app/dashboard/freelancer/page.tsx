'use client';

import { useState, useEffect } from 'react';
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
  analyticsApi,
} from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { Contract, Proposal, Project } from '@/types';
import { toast } from 'sonner';
import { DollarSign, FolderOpen, FileText, Star, TrendingUp, Clock, ArrowUpRight, Briefcase, Wallet, Loader2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-warning-subtle text-warning',
  accepted: 'bg-success-subtle text-success',
  rejected: 'bg-destructive-subtle text-destructive',
  withdrawn: 'bg-muted text-muted-foreground',
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.round(diffMs / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (Math.abs(diffSec) < 60) return rtf.format(-diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, 'minute');
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(-diffHour, 'hour');
  const diffDay = Math.round(diffHour / 24);
  return rtf.format(-diffDay, 'day');
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
  const [totalEarnings, setTotalEarnings] = useState<number | null>(null);
  const [projectsCompleted, setProjectsCompleted] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [activeContracts, setActiveContracts] = useState<ActiveContractView[]>([]);
  const [pendingProposalCount, setPendingProposalCount] = useState(0);
  const [recentProposals, setRecentProposals] = useState<RecentProposalView[]>([]);
  const [recommended, setRecommended] = useState<RecommendedProjectView[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const load = async () => {
      try {
        const [analyticsRes, contractsRes, proposalsRes, recommendationsRes, reputationRes] =
          await Promise.allSettled([
            analyticsApi.getFreelancer(),
            contractsApi.list(),
            proposalsApi.getMine(),
            matchingApi.getProjectRecommendations(3),
            reputationApi.getScore(currentUser.id),
          ]);

        if (analyticsRes.status === 'fulfilled') {
          setTotalEarnings(analyticsRes.value.data.totalEarnings);
          setProjectsCompleted(analyticsRes.value.data.projectsCompleted);
        }

        if (reputationRes.status === 'fulfilled') {
          setAverageRating(reputationRes.value.data.averageRating);
          setTotalRatings(reputationRes.value.data.totalRatings);
        }

        if (contractsRes.status === 'fulfilled') {
          const active = contractsRes.value.data.items.filter((c) => c.status === 'active');
          const projects = await Promise.all(
            active.map((c) => projectsApi.get(c.projectId).then((r) => r.data).catch(() => null))
          );
          setActiveContracts(active.map((contract, i) => ({ contract, project: projects[i] })));
        }

        if (proposalsRes.status === 'fulfilled') {
          const all = proposalsRes.value.data;
          setPendingProposalCount(all.filter((p) => p.status === 'pending').length);

          const recent = all
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3);
          const projects = await Promise.all(
            recent.map((p) => projectsApi.get(p.projectId).then((r) => r.data).catch(() => null))
          );
          setRecentProposals(recent.map((proposal, i) => ({ proposal, project: projects[i] })));
        }

        if (recommendationsRes.status === 'fulfilled') {
          const recs = recommendationsRes.value.data;
          const projects = await Promise.all(
            recs.map((r) => projectsApi.get(r.projectId).then((res) => res.data).catch(() => null))
          );
          setRecommended(
            recs
              .map((r, i) => ({ project: projects[i], matchScore: r.matchScore, matchedSkills: r.matchedSkills }))
              .filter((r): r is RecommendedProjectView => r.project !== null)
          );
        }
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Earned',
      value: totalEarnings !== null ? `$${totalEarnings.toLocaleString()}` : '—',
      change: projectsCompleted !== null ? `${projectsCompleted} completed contracts` : undefined,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back{currentUser?.name ? `, ${currentUser.name}` : ''}!</h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your work</p>
        </div>
        <Link href="/dashboard/freelancer/projects">
          <Button variant="gradient">
            <Briefcase className="w-4 h-4 mr-2" /> Browse Projects
          </Button>
        </Link>
      </div>

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
                  <span>${proposal.proposedRate.toLocaleString()}</span>
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
            <p className="text-sm text-muted-foreground py-8 text-center">
              No recommendations yet — add skills to your profile to get matched with projects
            </p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {recommended.map(({ project, matchScore, matchedSkills }) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
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
