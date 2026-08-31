'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminApi, disputesApi, contractsApi } from '@/lib/api';
import { safeAttachmentUrl } from '@/lib/attachment-presentation';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { formatRelativeTime } from '@/lib/format';
import type { Dispute, Contract, DisputeStatus } from '@/types';
import { toast } from 'sonner';
import { reportFailure, reportLoadFailure } from '@/lib/report-failure';
import { Scale, AlertTriangle, Clock, CheckCircle, FileText, DollarSign } from 'lucide-react';
import { ListSkeleton } from '@/components/dashboard/skeletons';
import { EmptyState } from '@/components/ui/empty-state';

const statusColors: Record<DisputeStatus, string> = {
  open: 'bg-destructive-subtle text-destructive',
  under_review: 'bg-warning-subtle text-warning',
  resolved: 'bg-success-subtle text-success',
};

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return 'recently';
  return formatRelativeTime(iso);
}

interface DisputeView {
  dispute: Dispute;
  contract: Contract | null;
}

export default function DisputesPage() {
  const [views, setViews] = useState<DisputeView[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DisputeStatus>('open');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState<Record<string, string>>({});
  const [verifyingEvidenceId, setVerifyingEvidenceId] = useState<string | null>(null);
  const [verifiedEvidenceIds, setVerifiedEvidenceIds] = useState<Set<string>>(new Set());

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
        status: raw.status || 'open',
        evidence: Array.isArray(raw.evidence) ? raw.evidence : [],
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

  const handleResolve = async (disputeId: string, decision: 'freelancer_favor' | 'employer_favor') => {
    const reason = reasoning[disputeId]?.trim();
    if (!reason) {
      toast.warning('Add resolution notes before resolving');
      return;
    }
    setResolvingId(disputeId);
    try {
      const { data: updated } = await disputesApi.resolve(disputeId, decision, reason);
      setViews((prev) => prev.map((v) => (v.dispute.id === disputeId ? { ...v, dispute: updated } : v)));
      toast.success('Dispute resolved');
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
      toast.error(getApiErrorMessage(error, 'Unable to verify this evidence.'));
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
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${amountInDispute.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">In Dispute</p>
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
            {byStatus(status).map(({ dispute, contract }) => (
              <Card key={dispute.id} className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{contract?.project?.title ?? 'Unknown project'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {contract?.freelancer?.name ?? 'Freelancer'} vs {contract?.employer?.name ?? 'Employer'}
                      </p>
                    </div>
                    <Badge className={statusColors[dispute.status]}>{dispute.status.replace('_', ' ')}</Badge>
                  </div>

                  <div className="p-3 rounded-lg bg-secondary/50 border border-border mb-4">
                    <p className="text-sm">
                      <span className="font-medium">Reason: </span>
                      {dispute.reason}
                    </p>
                  </div>

                  {(dispute.evidence || []).length > 0 && (
                    <div className="space-y-2 mb-4">
                      {(dispute.evidence || []).map((ev) => {
                        const evidenceUrl = safeAttachmentUrl(ev.content);
                        const verified = verifiedEvidenceIds.has(ev.id);
                        return (
                        <div key={ev.id} className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm text-muted-foreground">
                          <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                          {ev.type === 'text' ? (
                            <span className="min-w-0 flex-1 break-words">{ev.content}</span>
                          ) : evidenceUrl ? (
                            <a href={evidenceUrl} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 underline">
                              {ev.type === 'file' ? 'View file' : ev.content}
                            </a>
                          ) : <span className="min-w-0 flex-1">Attachment unavailable</span>}
                          {verified ? <Badge variant="secondary">Verified</Badge> : <Button type="button" size="sm" variant="outline" disabled={verifyingEvidenceId === ev.id} onClick={() => void handleVerifyEvidence(dispute.id, ev.id)}>{verifyingEvidenceId === ev.id ? 'Verifying…' : 'Verify evidence'}</Button>}
                        </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    {contract && <span className="font-medium text-primary">${contract.totalAmount.toLocaleString()}</span>}
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {(dispute.evidence || []).length} evidence items
                    </span>
                    <span>{relativeTime(dispute.createdAt)}</span>
                  </div>

                  {dispute.status !== 'resolved' && (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Admin resolution notes..."
                        rows={2}
                        value={reasoning[dispute.id] ?? ''}
                        onChange={(e) => setReasoning((prev) => ({ ...prev, [dispute.id]: e.target.value }))}
                      />
                      <div className="flex gap-3">
                        <Button
                          variant="gradient"
                          size="sm"
                          disabled={resolvingId === dispute.id}
                          onClick={() => handleResolve(dispute.id, 'freelancer_favor')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Resolve in Favor of Freelancer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-success border-success-border"
                          disabled={resolvingId === dispute.id}
                          onClick={() => handleResolve(dispute.id, 'employer_favor')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Resolve in Favor of Employer
                        </Button>
                      </div>
                    </div>
                  )}

                  {dispute.status === 'resolved' && dispute.resolution && (
                    <div className="p-3 rounded-lg bg-success-subtle border border-success-border">
                      <p className="text-sm text-success flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Resolved in favor of {dispute.resolution.decision === 'freelancer_favor' ? 'freelancer' : 'employer'} — {dispute.resolution.reasoning}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
