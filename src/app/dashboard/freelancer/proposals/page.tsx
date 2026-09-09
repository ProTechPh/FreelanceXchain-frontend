'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { proposalsApi, projectsApi } from '@/lib/api';
import type { Proposal, Project, ProposalStatus } from '@/types';
import { toast } from '@/components/ui/toast';
import { reportLoadFailure } from '@/lib/report-failure';
import { Clock, CheckCircle, XCircle, FileText, RefreshCw } from 'lucide-react';
import { ListSkeleton } from '@/components/dashboard/skeletons';
import { formatAmount, formatDate } from '@/lib/format';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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
  const [confirmWithdrawProposal, setConfirmWithdrawProposal] = useState<ProposalView | null>(null);

  const load = useCallback(async () => {
    const { data: all } = await proposalsApi.getMine();
    const projects = await Promise.all(
      all.map((p) => projectsApi.get(p.projectId).then((r) => r.data).catch(() => null))
    );
    setProposals(all.map((proposal, i) => ({ proposal, project: projects[i] })));
  }, []);

  // Reported here rather than inside the loader so the toast's Retry can
  // call it again; a self-reference inside the callback is not allowed.
  useEffect(() => {
    let active = true;
    function run() {
      load()
        .catch((error) => {
          if (active) reportLoadFailure(error, 'your proposals', run);
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

  const byStatus = (status: ProposalStatus) => proposals.filter((p) => p.proposal.status === status);

  const handleRefresh = useCallback(async () => {
    await load();
  }, [load]);

  if (loading) {
    return (
      <ListSkeleton rows={4} label="Loading proposals" />
    );
  }

  const statuses: ProposalStatus[] = ['pending', 'accepted', 'rejected', 'withdrawn'];

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My proposals</h1>
          <p className="text-sm text-muted-foreground">Track and manage your submitted proposals</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleRefresh()}
          className="self-start sm:self-auto gap-2 text-xs"
        >
          <RefreshCw className="size-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {statuses.map((status) => {
          const config = statusConfig[status];
          const count = byStatus(status).length;
          const isActive = activeTab === status;
          return (
            <Card
              key={status}
              onClick={() => setActiveTab(status)}
              className={cn(
                "bg-card border-border cursor-pointer transition-all duration-fast hover:border-primary/50 touch-manipulation min-w-0 overflow-hidden",
                isActive && "border-primary/60 ring-1 ring-primary/40 bg-primary/[0.03]"
              )}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className={`size-8 sm:size-10 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                    <config.icon className={`size-4 sm:size-5 ${config.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg sm:text-2xl font-bold leading-tight">{count}</p>
                    <p className="text-3xs sm:text-xs text-muted-foreground capitalize truncate">{status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProposalStatus)} className="w-full">
        <div className="w-full overflow-x-auto no-scrollbar pb-1">
          <TabsList className="inline-flex w-full sm:w-auto min-w-max justify-start sm:justify-center">
            {statuses.map((status) => (
              <TabsTrigger key={status} value={status} className="shrink-0 text-xs sm:text-sm px-3 py-1.5 whitespace-nowrap">
                {statusConfig[status].label} ({byStatus(status).length})
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {statuses.map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {byStatus(status).length === 0 && (
              <p className="text-sm text-muted-foreground py-12 text-center">
                No {statusConfig[status].label.toLowerCase()} proposals
              </p>
            )}
            {byStatus(status).map(({ proposal, project }) => (
              <Card key={proposal.id} className="bg-card border-border min-w-0 overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base sm:text-lg break-words line-clamp-2" title={project?.title ?? 'Untitled project'}>
                        {project?.title ?? 'Untitled project'}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                        {project?.employer?.companyName ?? project?.employer?.name ?? ''}
                      </p>
                    </div>
                    <Badge className={cn("shrink-0 text-2xs sm:text-xs", statusConfig[status].bg, statusConfig[status].color)}>
                      {statusConfig[status].label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-muted-foreground">
                    <span className="font-bold text-primary">{formatAmount(proposal.proposedRate)}</span>
                    <span className="flex items-center gap-1"><Clock className="size-3 shrink-0" />{proposal.estimatedDuration} days</span>
                    <span className="flex items-center gap-1">
                      {status === 'pending' ? 'Submitted' : statusConfig[status].label}{' '}
                      {formatDate(status === 'pending' ? proposal.createdAt : proposal.updatedAt)}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center gap-2">
                    {status === 'accepted' && (
                      <Button asChild variant="gradient" size="sm" className="h-8 text-xs font-semibold shrink-0">
                        <Link href="/dashboard/freelancer/contracts">
                          <FileText className="size-3.5 mr-1.5" /> View Contract
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs shrink-0">
                      <Link href={`/dashboard/freelancer/proposals/${proposal.id}`}>
                        View Proposal
                      </Link>
                    </Button>
                    {project && (
                      <Button asChild variant="ghost" size="sm" className="h-8 text-xs shrink-0">
                        <Link href={`/dashboard/freelancer/projects/${project.id}`}>
                          View Project
                        </Link>
                      </Button>
                    )}
                    {status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-destructive hover:bg-destructive/10 shrink-0"
                        disabled={withdrawingId === proposal.id}
                        onClick={() => setConfirmWithdrawProposal({ proposal, project })}
                      >
                        {withdrawingId === proposal.id ? 'Withdrawing…' : 'Withdraw'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {/* Proposal Withdrawal Confirmation Modal */}
      <Dialog
        open={confirmWithdrawProposal !== null}
        onOpenChange={(open) => {
          if (!open && !withdrawingId) setConfirmWithdrawProposal(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Withdraw this proposal?</DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw your proposal for{' '}
              <strong className="text-foreground">
                &quot;{confirmWithdrawProposal?.project?.title ?? 'this project'}&quot;
              </strong>
              ? You will be removed from consideration and cannot un-withdraw.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmWithdrawProposal(null)}
              disabled={Boolean(withdrawingId)}
            >
                            Keep Proposal
            </Button>
            <Button
              variant="destructive"
              loading={Boolean(withdrawingId)}
              loadingText="Withdrawing…"
              onClick={async () => {
                if (!confirmWithdrawProposal) return;
                const id = confirmWithdrawProposal.proposal.id;
                setWithdrawingId(id);
                try {
                  const { data: updated } = await proposalsApi.withdraw(id);
                  setProposals((prev) => prev.map((p) => (p.proposal.id === id ? { ...p, proposal: updated } : p)));
                  setConfirmWithdrawProposal(null);
                  toast.success('Proposal withdrawn');
                } catch {
                  toast.error('Failed to withdraw proposal');
                } finally {
                  setWithdrawingId(null);
                }
              }}
            >
              Confirm Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
