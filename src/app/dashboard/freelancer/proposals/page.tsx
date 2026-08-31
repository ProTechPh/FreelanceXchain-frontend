'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { proposalsApi, projectsApi } from '@/lib/api';
import type { Proposal, Project, ProposalStatus } from '@/types';
import { toast } from 'sonner';
import { Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { ListSkeleton } from '@/components/dashboard/skeletons';

const statusConfig: Record<ProposalStatus, { icon: typeof Clock; color: string; bg: string; label: string }> = {
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning-subtle', label: 'Pending' },
  accepted: { icon: CheckCircle, color: 'text-success', bg: 'bg-success-subtle', label: 'Accepted' },
  rejected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive-subtle', label: 'Rejected' },
  withdrawn: { icon: XCircle, color: 'text-neutral', bg: 'bg-neutral-subtle', label: 'Withdrawn' },
};

interface ProposalView {
  proposal: Proposal;
  project: Project | null;
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<ProposalView[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProposalStatus>('pending');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: all } = await proposalsApi.getMine();
      const projects = await Promise.all(
        all.map((p) => projectsApi.get(p.projectId).then((r) => r.data).catch(() => null))
      );
      setProposals(all.map((proposal, i) => ({ proposal, project: projects[i] })));
    } catch {
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleWithdraw = async (id: string) => {
    setWithdrawingId(id);
    try {
      const { data: updated } = await proposalsApi.withdraw(id);
      setProposals((prev) => prev.map((p) => (p.proposal.id === id ? { ...p, proposal: updated } : p)));
      toast.success('Proposal withdrawn');
    } catch {
      toast.error('Failed to withdraw proposal');
    } finally {
      setWithdrawingId(null);
    }
  };

  const byStatus = (status: ProposalStatus) => proposals.filter((p) => p.proposal.status === status);

  if (loading) {
    return (
      <ListSkeleton rows={4} label="Loading proposals" />
    );
  }

  const statuses: ProposalStatus[] = ['pending', 'accepted', 'rejected', 'withdrawn'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My proposals</h1>
          <p className="text-muted-foreground">Track and manage your submitted proposals</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statuses.map((status) => {
          const config = statusConfig[status];
          const count = byStatus(status).length;
          return (
            <Card key={status} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <config.icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground capitalize">{status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProposalStatus)}>
        <TabsList>
          {statuses.map((status) => (
            <TabsTrigger key={status} value={status}>
              {statusConfig[status].label} ({byStatus(status).length})
            </TabsTrigger>
          ))}
        </TabsList>

        {statuses.map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {byStatus(status).length === 0 && (
              <p className="text-sm text-muted-foreground py-12 text-center">
                No {statusConfig[status].label.toLowerCase()} proposals
              </p>
            )}
            {byStatus(status).map(({ proposal, project }) => (
              <Card key={proposal.id} className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{project?.title ?? 'Untitled project'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {project?.employer?.companyName ?? project?.employer?.name ?? ''}
                      </p>
                    </div>
                    <Badge className={`${statusConfig[status].bg} ${statusConfig[status].color}`}>
                      {statusConfig[status].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="font-medium text-primary">{proposal.proposedRate.toLocaleString()} ETH</span>
                    <span>{proposal.estimatedDuration} days</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {status === 'pending' ? 'Submitted' : statusConfig[status].label}{' '}
                      {new Date(status === 'pending' ? proposal.createdAt : proposal.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Link href={`/dashboard/freelancer/proposals/${proposal.id}`}>
                      <Button variant="outline" size="sm">View Proposal</Button>
                    </Link>
                    {project && (
                      <Link href={`/dashboard/freelancer/projects/${project.id}`}>
                        <Button variant="ghost" size="sm">View Project</Button>
                      </Link>
                    )}
                    {status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        disabled={withdrawingId === proposal.id}
                        onClick={() => handleWithdraw(proposal.id)}
                      >
                        {withdrawingId === proposal.id ? 'Withdrawing…' : 'Withdraw'}
                      </Button>
                    )}
                    {status === 'accepted' && (
                      <Link href="/dashboard/freelancer/contracts">
                        <Button variant="gradient" size="sm">
                          <FileText className="w-4 h-4 mr-2" /> View Contract
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
