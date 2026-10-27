'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminApi, disputesApi, contractsApi } from '@/lib/api';
import { csrfTokenManager } from '@/lib/api-client';
import { safeAttachmentUrl } from '@/lib/attachment-presentation';
import { AttachmentPreviewDialog } from '@/components/ui/attachment-preview-dialog';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { formatAmount, formatRelativeTime } from '@/lib/format';
import type { Dispute, Contract, DisputeStatus, Evidence } from '@/types';
import { toast } from 'sonner';
import { reportFailure, reportLoadFailure } from '@/lib/report-failure';
import { Scale, AlertTriangle, Clock, CheckCircle, FileText, Coins, Maximize2, User, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ListSkeleton } from '@/components/dashboard/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdminPermissionGate } from '@/components/admin/AdminPermissionGate';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import { useEthPhpRate } from '@/hooks/use-eth-php-rate';

const statusColors: Record<DisputeStatus, string> = {
  open: 'bg-destructive-subtle text-destructive',
  under_review: 'bg-warning-subtle text-warning',
  resolved: 'bg-success-subtle text-success',
};

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return 'recently';
  return formatRelativeTime(iso);
}

interface PartyInfo {
  name: string;
  role: 'Freelancer' | 'Employer' | 'Participant';
  isFreelancer: boolean;
  isEmployer: boolean;
}

function getPartyInfo(userId: string | undefined | null, contract: Contract | null): PartyInfo {
  if (!userId) {
    return { name: 'Unknown User', role: 'Participant', isFreelancer: false, isEmployer: false };
  }

  const isFreelancer =
    userId === contract?.freelancerId ||
    userId === contract?.freelancer?.userId ||
    userId === contract?.freelancer?.id;

  const isEmployer =
    userId === contract?.employerId ||
    userId === contract?.employer?.userId ||
    userId === contract?.employer?.id;

  if (isFreelancer) {
    return {
      name: contract?.freelancer?.name || 'Freelancer',
      role: 'Freelancer',
      isFreelancer: true,
      isEmployer: false,
    };
  }

  if (isEmployer) {
    return {
      name: contract?.employer?.name || contract?.employer?.companyName || 'Employer',
      role: 'Employer',
      isFreelancer: false,
      isEmployer: true,
    };
  }

  return {
    name: userId.length > 12 ? `${userId.slice(0, 8)}…` : userId,
    role: 'Participant',
    isFreelancer: false,
    isEmployer: false,
  };
}

type RawEvidenceItem = Partial<Evidence> & {
  submitter_id?: string;
  submitted_by?: string;
  submittedBy?: string;
  evidence_type?: 'text' | 'file' | 'link';
  evidenceType?: 'text' | 'file' | 'link';
  description?: string;
  submitted_at?: string;
  createdAt?: string;
  created_at?: string;
};

interface DisputeView {
  dispute: Dispute;
  contract: Contract | null;
}

export default function DisputesPage() {
  // Contract amounts are stored in ETH; show pesos with the ETH figure beside it.
  const { formatEthToPhp } = useEthPhpRate();
  const [views, setViews] = useState<DisputeView[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DisputeStatus>('open');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState<Record<string, string>>({});
  const [settlementPercentages, setSettlementPercentages] = useState<Record<string, string>>({});
  const [verifyingEvidenceId, setVerifyingEvidenceId] = useState<string | null>(null);
  const [verifiedEvidenceIds, setVerifiedEvidenceIds] = useState<Set<string>>(new Set());
  const [confirmResolve, setConfirmResolve] = useState<{
    disputeId: string;
    decision: 'freelancer_favor' | 'employer_favor' | 'split';
    percentage?: number;
  } | null>(null);
  const [viewingEvidence, setViewingEvidence] = useState<{ id: string; url: string; type: string; name?: string } | null>(null);

  const { hasPermission } = useAdminPermissions();
  const canManageDisputes = hasPermission('disputes:manage');

  const load = useCallback(async () => {
    const { data } = await adminApi.getDisputeManagement();
    const rawDisputes: Dispute[] = (data.disputes || []).map((d) => {
      const raw = d as Dispute & {
        contract_id?: string;
        milestone_id?: string;
        initiator_id?: string;
        created_at?: string;
        updated_at?: string;
      };
      return {
        ...raw,
        id: raw.id || '',
        contractId: raw.contractId || raw.contract_id || '',
        milestoneId: raw.milestoneId || raw.milestone_id || '',
        initiatorId: raw.initiatorId || raw.initiator_id || '',
        reason: raw.reason || '',
        evidence: (Array.isArray(raw.evidence) ? (raw.evidence as RawEvidenceItem[]) : []).map((ev: RawEvidenceItem) => ({
          id: ev.id || '',
          submitterId: ev.submitterId || ev.submitter_id || ev.submitted_by || ev.submittedBy || '',
          type: (ev.type || ev.evidence_type || ev.evidenceType || 'text') as 'text' | 'file' | 'link',
          content: ev.content || ev.description || '',
          submittedAt: ev.submittedAt || ev.submitted_at || ev.createdAt || ev.created_at || new Date().toISOString(),
        })),
        resolution: raw.resolution ?? null,
        createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
        updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
      };
    });
    const sorted = rawDisputes
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);
    const contracts = await Promise.all(
      sorted.map((d) => (d.contractId ? contractsApi.get(d.contractId).then((r) => r.data).catch(() => null) : Promise.resolve(null)))
    );
    setViews(sorted.map((dispute, i) => ({ dispute, contract: contracts[i] })));
  }, []);

  // Reported here rather than inside the loader so the toast's Retry can
  // call it again; a self-reference inside the callback is not allowed.
  useEffect(() => {
    let active = true;
    void csrfTokenManager.ensureToken();
    function run() {
      load()
        .catch((error) => {
          if (active) reportLoadFailure(error, 'disputes', run);
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

  const handleResolve = async (
    disputeId: string,
    decision: 'freelancer_favor' | 'employer_favor' | 'split',
    percentage?: number
  ) => {
    const reason = reasoning[disputeId]?.trim();
    if (!reason) {
      toast.warning('Add resolution notes before resolving — the parties will see your reasoning.');
      return;
    }
    if (decision === 'split') {
      const pct = percentage ?? Number(settlementPercentages[disputeId] ?? 50);
      if (isNaN(pct) || pct <= 0 || pct >= 100) {
        toast.warning('Settlement percentage must be between 1 and 99.');
        return;
      }
    }
    setResolvingId(disputeId);
    try {
      const freelancerBps =
        decision === 'split'
          ? Math.round((percentage ?? Number(settlementPercentages[disputeId] ?? 50)) * 100)
          : undefined;
      const { data: updated } = await disputesApi.resolve(disputeId, decision, reason, freelancerBps);
      const resolvedDispute: Dispute = {
        ...updated,
        status: 'resolved',
        resolution: updated.resolution ?? {
          decision,
          reasoning: reason,
          resolvedBy: 'admin',
          resolvedAt: new Date().toISOString(),
        },
      };
      setViews((prev) =>
        prev.map((v) => (v.dispute.id === disputeId ? { ...v, dispute: resolvedDispute } : v))
      );
      const decisionLabel =
        decision === 'freelancer_favor'
          ? 'in favor of freelancer'
          : decision === 'employer_favor'
          ? 'in favor of employer'
          : `with ${percentage ?? 50}% split`;
      toast.success(`Dispute resolved ${decisionLabel}`);
      setConfirmResolve(null);
      setTab('resolved');
      void load();
    } catch (error) {
      console.error(
        '[disputes] resolve failed. If this is unexpected, check that the admin '
        + 'account carries the admin role on its JWT.',
        error,
      );
      reportFailure(error, 'resolve this dispute');
    } finally {
      setResolvingId(null);
    }
  };

  const handleVerifyEvidence = async (disputeId: string, evidenceId: string) => {
    setVerifyingEvidenceId(evidenceId);
    try {
      await disputesApi.verifyEvidence(disputeId, evidenceId);
      setVerifiedEvidenceIds((current) => new Set(current).add(evidenceId));
      toast.success('Evidence verified.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Couldn\'t verify this evidence. Try again.'));
    } finally {
      setVerifyingEvidenceId(null);
    }
  };

  const byStatus = (status: DisputeStatus) => views.filter((v) => v.dispute.status === status);

  if (loading) {
    return (
      <ListSkeleton rows={4} label="Loading disputes" />
    );
  }

  const openCount = byStatus('open').length;
  const underReviewCount = byStatus('under_review').length;
  const resolvedCount = byStatus('resolved').length;
  const amountInDispute = byStatus('open').reduce((sum, v) => sum + (v.contract?.totalAmount ?? 0), 0)
    + byStatus('under_review').reduce((sum, v) => sum + (v.contract?.totalAmount ?? 0), 0);

  const statuses: DisputeStatus[] = ['open', 'under_review', 'resolved'];

  return (
    <AdminPermissionGate permission="disputes:view" title="Disputes">
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Dispute management</h1>
        <p className="text-muted-foreground">Resolve conflicts between freelancers and employers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive-subtle flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openCount}</p>
                <p className="text-xs text-muted-foreground">Open Disputes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-subtle flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{underReviewCount}</p>
                <p className="text-xs text-muted-foreground">Under Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-subtle flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resolvedCount}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatEthToPhp(amountInDispute)}</p>
                <p className="text-xs text-muted-foreground">
                  In dispute · {formatAmount(amountInDispute, { currency: 'ETH' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as DisputeStatus)}>
        <TabsList>
          <TabsTrigger value="open">Open ({openCount})</TabsTrigger>
          <TabsTrigger value="under_review">Under Review ({underReviewCount})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedCount})</TabsTrigger>
        </TabsList>

        {statuses.map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {byStatus(status).length === 0 && (
              <EmptyState
                size="sm"
                icon={Scale}
                title="No disputes in this queue"
                description="Disputes land here when a participant escalates a funded contract."
              />
            )}
            {byStatus(status).map(({ dispute, contract }) => {
              const initiatorInfo = getPartyInfo(dispute.initiatorId, contract);
              return (
              <Card key={dispute.id} className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1.5">
                      <h3 className="font-semibold text-lg">{contract?.project?.title ?? 'Unknown project'}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          <strong className="text-foreground">{contract?.freelancer?.name ?? 'Freelancer'}</strong> (Freelancer)
                          {' vs '}
                          <strong className="text-foreground">{contract?.employer?.name ?? 'Employer'}</strong> (Employer)
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="text-xs text-muted-foreground font-medium">Dispute Initiator:</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 border flex items-center gap-1",
                            initiatorInfo.isFreelancer
                              ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                              : initiatorInfo.isEmployer
                              ? "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          )}
                        >
                          <User className="w-3 h-3" />
                          <span>Filed by <strong>{initiatorInfo.name}</strong> ({initiatorInfo.role})</span>
                        </Badge>
                      </div>
                    </div>
                    <Badge className={statusColors[dispute.status]}>{dispute.status.replace('_', ' ')}</Badge>
                  </div>

                  <div className="p-3.5 rounded-lg bg-secondary/50 border border-border mb-4 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-primary" />
                        Dispute Reason / Claim
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Initiated by <strong className="text-foreground">{initiatorInfo.name}</strong> ({initiatorInfo.role})
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 pl-5 leading-relaxed">
                      {dispute.reason}
                    </p>
                  </div>

                  {(dispute.evidence || []).length > 0 && (
                    <div className="space-y-2.5 mb-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        <span className="flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5" />
                          Submitted Evidence ({(dispute.evidence || []).length})
                        </span>
                      </div>
                      {(dispute.evidence || []).map((ev) => {
                        const evidenceUrl = safeAttachmentUrl(ev.content);
                        const verified = verifiedEvidenceIds.has(ev.id);
                        const submitterInfo = getPartyInfo(ev.submitterId, contract);
                        return (
                        <div key={ev.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 text-sm bg-muted/20">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-1.5 border-b border-border/50">
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">Uploaded by:</span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-2xs font-medium px-1.5 py-0",
                                  submitterInfo.isFreelancer
                                    ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                                    : submitterInfo.isEmployer
                                    ? "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300"
                                    : "border-border bg-secondary"
                                )}
                              >
                                {submitterInfo.name} ({submitterInfo.role})
                              </Badge>
                            </div>
                            {ev.submittedAt && (
                              <span className="text-2xs text-muted-foreground font-sans">
                                {relativeTime(ev.submittedAt)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-start gap-2 text-muted-foreground">
                            <FileText className="w-4 h-4 mt-0.5 shrink-0 text-foreground/70" />
                            {ev.type === 'text' ? (
                              <span className="min-w-0 flex-1 break-words text-foreground/90">{ev.content}</span>
                            ) : evidenceUrl ? (
                              <div className="min-w-0 flex-1 flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setViewingEvidence({ id: ev.id, url: evidenceUrl, type: ev.type, name: ev.type === 'file' ? 'Evidence Attachment' : ev.content })}
                                  className="underline font-medium hover:text-foreground text-left cursor-pointer"
                                  aria-label="View evidence file"
                                >
                                  {ev.type === 'file' ? 'View file' : ev.content}
                                </button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-primary gap-1"
                                  onClick={() => setViewingEvidence({ id: ev.id, url: evidenceUrl, type: ev.type, name: ev.type === 'file' ? 'Evidence Attachment' : ev.content })}
                                  aria-label="Open evidence attachment viewer"
                                >
                                  <Maximize2 className="w-3 h-3" />
                                  View attachment
                                </Button>
                              </div>
                            ) : <span className="min-w-0 flex-1">Attachment unavailable</span>}
                            {verified ? (
                              <Badge variant="secondary" className="shrink-0 text-xs">Verified</Badge>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="shrink-0 h-7 text-xs"
                                disabled={verifyingEvidenceId === ev.id}
                                onClick={() => void handleVerifyEvidence(dispute.id, ev.id)}
                              >
                                {verifyingEvidenceId === ev.id ? 'Verifying…' : 'Verify evidence'}
                              </Button>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    {contract && (
                      <span title="Total value of the disputed contract">
                        <span className="text-muted-foreground">Contract value </span>
                        <span className="font-medium text-primary">{formatEthToPhp(contract.totalAmount)}</span>
                        <span className="ml-1 text-xs">({formatAmount(contract.totalAmount, { currency: contract.currency || 'ETH' })})</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {(dispute.evidence || []).length} evidence items
                    </span>
                    <span>{relativeTime(dispute.createdAt)}</span>
                  </div>

                  {dispute.status !== 'resolved' && canManageDisputes && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label htmlFor={`resolution-notes-${dispute.id}`} className="text-xs font-medium text-muted-foreground">
                          Resolution notes
                        </label>
                        <Textarea
                          id={`resolution-notes-${dispute.id}`}
                          aria-label="Resolution notes"
                          placeholder="Admin resolution notes..."
                          rows={2}
                          value={reasoning[dispute.id] ?? ''}
                          onChange={(e) => setReasoning((prev) => ({ ...prev, [dispute.id]: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor={`settlement-percentage-${dispute.id}`} className="text-xs font-medium text-muted-foreground">
                          Settlement percentage (% to freelancer)
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            id={`settlement-percentage-${dispute.id}`}
                            aria-label="Settlement percentage"
                            name="settlementPercentage"
                            type="number"
                            min={1}
                            max={99}
                            placeholder="50"
                            className="w-32"
                            value={settlementPercentages[dispute.id] ?? '50'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSettlementPercentages((prev) => ({ ...prev, [dispute.id]: val }));
                            }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {Number(settlementPercentages[dispute.id] ?? 50)}% freelancer / {100 - Number(settlementPercentages[dispute.id] ?? 50)}% employer
                          </span>
                        </div>
                        {settlementPercentages[dispute.id] !== undefined && (
                          (Number(settlementPercentages[dispute.id]) < 1 || Number(settlementPercentages[dispute.id]) > 99 || isNaN(Number(settlementPercentages[dispute.id]))) && (
                            <p className="text-xs text-destructive" role="alert">
                              Settlement percentage must be between 1 and 99.
                            </p>
                          )
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="gradient"
                          size="sm"
                          disabled={resolvingId === dispute.id}
                          onClick={() => setConfirmResolve({ disputeId: dispute.id, decision: 'freelancer_favor' })}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Resolve in Favor of Freelancer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-success border-success-border"
                          disabled={resolvingId === dispute.id}
                          onClick={() => setConfirmResolve({ disputeId: dispute.id, decision: 'employer_favor' })}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Resolve in Favor of Employer
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={resolvingId === dispute.id}
                          onClick={() => {
                            const pct = Number(settlementPercentages[dispute.id] ?? 50);
                            setConfirmResolve({ disputeId: dispute.id, decision: 'split', percentage: pct });
                          }}
                        >
                          <Scale className="w-4 h-4 mr-2" /> Submit the settlement
                        </Button>
                      </div>
                    </div>
                  )}

                  {dispute.status === 'resolved' && dispute.resolution && (
                    <div className="p-3 rounded-lg bg-success-subtle border border-success-border">
                      <p className="text-sm text-success flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Resolved {dispute.resolution.decision === 'freelancer_favor' ? 'in favor of freelancer' : dispute.resolution.decision === 'employer_favor' ? 'in favor of employer' : 'with split'} — {dispute.resolution.reasoning}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )})}
          </TabsContent>
        ))}
      </Tabs>

      {/* Resolve Confirmation Dialog */}
      <Dialog
        open={confirmResolve !== null}
        onOpenChange={(open) => {
          if (!open && !resolvingId) setConfirmResolve(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Resolve this dispute?</DialogTitle>
            <DialogDescription>
              This action is <strong>permanent and cannot be reversed</strong>. The escrow funds will be released to{' '}
              <strong className="text-foreground">
                {confirmResolve?.decision === 'freelancer_favor'
                  ? 'the freelancer (100%)'
                  : confirmResolve?.decision === 'employer_favor'
                  ? 'the employer (100%)'
                  : `both parties (${confirmResolve?.percentage ?? settlementPercentages[confirmResolve?.disputeId ?? ''] ?? 50}% to freelancer)`}
              </strong>.
            </DialogDescription>
          </DialogHeader>

          {confirmResolve && (
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <label htmlFor="dialog-resolution-notes" className="text-xs font-medium text-muted-foreground">
                  Resolution notes
                </label>
                <Textarea
                  id="dialog-resolution-notes"
                  placeholder="Admin resolution notes..."
                  rows={2}
                  value={reasoning[confirmResolve.disputeId] ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setReasoning((prev) => ({ ...prev, [confirmResolve.disputeId]: val }));
                  }}
                />
              </div>

              {confirmResolve.decision === 'split' && (
                <div className="space-y-1">
                  <label htmlFor="settlement-percentage" className="text-xs font-medium text-muted-foreground">
                    Settlement percentage (% to freelancer)
                  </label>
                  <Input
                    id="settlement-percentage"
                    aria-label="Settlement percentage"
                    name="settlementPercentage"
                    type="number"
                    min={1}
                    max={99}
                    placeholder="50"
                    value={settlementPercentages[confirmResolve.disputeId] ?? String(confirmResolve.percentage ?? 50)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSettlementPercentages((prev) => ({ ...prev, [confirmResolve.disputeId]: val }));
                      setConfirmResolve((prev) => prev ? { ...prev, percentage: Number(val) } : null);
                    }}
                  />
                  {(Number(settlementPercentages[confirmResolve.disputeId] ?? confirmResolve.percentage ?? 50) < 1 ||
                    Number(settlementPercentages[confirmResolve.disputeId] ?? confirmResolve.percentage ?? 50) > 99 ||
                    isNaN(Number(settlementPercentages[confirmResolve.disputeId] ?? confirmResolve.percentage ?? 50))) && (
                    <p className="text-xs text-destructive" role="alert">
                      Settlement percentage must be between 1 and 99.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmResolve(null)}
              disabled={Boolean(resolvingId)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={Boolean(resolvingId)}
              loadingText="Resolving…"
              disabled={
                Boolean(resolvingId) ||
                !confirmResolve ||
                !reasoning[confirmResolve.disputeId]?.trim() ||
                (confirmResolve.decision === 'split' && (
                  isNaN(Number(settlementPercentages[confirmResolve.disputeId] ?? confirmResolve.percentage ?? 50)) ||
                  Number(settlementPercentages[confirmResolve.disputeId] ?? confirmResolve.percentage ?? 50) < 1 ||
                  Number(settlementPercentages[confirmResolve.disputeId] ?? confirmResolve.percentage ?? 50) > 99
                ))
              }
              onClick={async () => {
                if (confirmResolve) {
                  await handleResolve(confirmResolve.disputeId, confirmResolve.decision, confirmResolve.percentage);
                }
              }}
            >
              Confirm Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evidence Attachment Viewer Dialog */}
      <AttachmentPreviewDialog
        open={viewingEvidence !== null}
        onOpenChange={(open) => {
          if (!open) setViewingEvidence(null);
        }}
        attachment={viewingEvidence ? {
          filename: viewingEvidence.name || 'Evidence Attachment',
          url: viewingEvidence.url,
        } : null}
      />
    </div>
    </AdminPermissionGate>
  );
}
