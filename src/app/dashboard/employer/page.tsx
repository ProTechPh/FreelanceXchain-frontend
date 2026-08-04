'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getStatusColor } from '@/lib/status-styles';
import Link from 'next/link';
import { projectsApi, analyticsApi, freelancersApi, reputationApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { Project, Proposal } from '@/types';
import { toast } from 'sonner';
import {
  DollarSign,
  FolderOpen,
  FileText,
  Users,
  Clock,
  ArrowUpRight,
  PlusCircle,
  Briefcase,
  Loader2,
} from 'lucide-react';

interface RecentProposalView {
  proposal: Proposal;
  projectTitle: string;
  freelancerName: string;
  rating: number | null;
}

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

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
}

export default function EmployerDashboard() {
  const currentUser = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingProposalCount, setPendingProposalCount] = useState(0);
  const [activeContractCount, setActiveContractCount] = useState<number | null>(null);
  const [recentProposals, setRecentProposals] = useState<RecentProposalView[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const load = async () => {
      try {
        const [analyticsRes, projectsRes] = await Promise.allSettled([
          analyticsApi.getEmployer(),
          projectsApi.getMyProjects(),
        ]);

        if (analyticsRes.status === 'fulfilled') {
          setTotalSpent(analyticsRes.value.data.totalSpent);
          setActiveContractCount(analyticsRes.value.data.projectsCompleted);
        }

        let myProjects: Project[] = [];
        if (projectsRes.status === 'fulfilled') {
          myProjects = projectsRes.value.data.items;
          setProjects(myProjects);
        }

        const openOrActive = myProjects
          .filter((p) => p.status === 'open' || p.status === 'in_progress')
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5);

        const proposalLists = await Promise.all(
          openOrActive.map((p) => projectsApi.getProposals(p.id).then((r) => r.data.items).catch(() => []))
        );

        const allProposals = openOrActive.flatMap((project, i) =>
          proposalLists[i].map((proposal) => ({ proposal, project }))
        );
        setPendingProposalCount(allProposals.filter((p) => p.proposal.status === 'pending').length);

        const recent = allProposals
          .sort((a, b) => new Date(b.proposal.createdAt).getTime() - new Date(a.proposal.createdAt).getTime())
          .slice(0, 3);

        const details = await Promise.all(
          recent.map(async ({ proposal }) => {
            const [profile, score] = await Promise.all([
              freelancersApi.getPublicProfile(proposal.freelancerId).catch(() => null),
              reputationApi.getScore(proposal.freelancerId).catch(() => null),
            ]);
            return { profile, score };
          })
        );

        setRecentProposals(
          recent.map(({ proposal, project }, i) => ({
            proposal,
            projectTitle: project.title,
            freelancerName: details[i].profile?.data.name ?? 'Freelancer',
            rating: details[i].score?.data.averageRating ?? null,
          }))
        );
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

  const activeProjects = projects.filter((p) => p.status === 'open' || p.status === 'in_progress');

  const stats = [
    {
      title: 'Active Projects',
      value: String(activeProjects.length),
      icon: FolderOpen,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Total Spent',
      value: totalSpent !== null ? `$${totalSpent.toLocaleString()}` : '—',
      icon: DollarSign,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Pending Proposals',
      value: String(pendingProposalCount),
      icon: FileText,
      color: 'text-cyan',
      bg: 'bg-cyan/10',
    },
    {
      title: 'Completed Contracts',
      value: activeContractCount !== null ? String(activeContractCount) : '—',
      icon: Briefcase,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back{currentUser?.name ? `, ${currentUser.name}` : ''}!</h1>
          <p className="text-muted-foreground">Manage your projects and find talent</p>
        </div>
        <Link href="/dashboard/employer/projects/new">
          <Button variant="gradient">
            <PlusCircle className="w-4 h-4 mr-2" /> Post Project
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
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Active Projects</CardTitle>
              <Link href="/dashboard/employer/projects">
                <Button variant="ghost" size="sm">
                  View All <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeProjects.length === 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No active projects yet — post one to start receiving proposals
                </p>
              )}
              {activeProjects.map((project) => {
                const milestones = project.milestones ?? [];
                const completedCount = milestones.filter((m) => m.status === 'completed').length;
                const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
                return (
                  <div
                    key={project.id}
                    className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{project.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>{project.proposalCount ?? 0} proposals</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(project.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">${project.budget.toLocaleString()}</p>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
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
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Recent Proposals */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Recent Proposals</CardTitle>
            <Link href="/dashboard/employer/projects">
              <Button variant="ghost" size="sm">
                View All <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProposals.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">No proposals yet</p>
            )}
            {recentProposals.map(({ proposal, projectTitle, freelancerName, rating }) => (
              <div key={proposal.id} className="p-3 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                    {initials(freelancerName)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{freelancerName}</p>
                    <p className="text-xs text-muted-foreground">{projectTitle}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-primary">${proposal.proposedRate.toLocaleString()}</span>
                  {rating !== null && <span>★ {rating.toFixed(1)}</span>}
                  <span>{relativeTime(proposal.createdAt)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/dashboard/employer/projects/new">
          <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-white" />
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
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Verification</p>
                <p className="text-xs text-muted-foreground">Complete identity verification</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
