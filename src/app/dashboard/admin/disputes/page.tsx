'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminApi, disputesApi, contractsApi } from '@/lib/api';
import type { Dispute, Contract, DisputeStatus } from '@/types';
import { toast } from 'sonner';
import { AlertTriangle, Clock, CheckCircle, FileText, DollarSign, Loader2 } from 'lucide-react';

const statusColors: Record<DisputeStatus, string> = {
  open: 'bg-red-500/10 text-red-500',
  under_review: 'bg-yellow-500/10 text-yellow-500',
  resolved: 'bg-green-500/10 text-green-500',
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

  const load = useCallback(async () => {
    try {
      const { data } = await adminApi.getDisputeManagement();
      const contracts = await Promise.all(
        data.disputes
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 50)
          .map((d) => contractsApi.get(d.contractId).then((r) => r.data).catch(() => null))
      );
      const sorted = data.disputes
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);
      setViews(sorted.map((dispute, i) => ({ dispute, contract: contracts[i] })));
    } catch {
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleResolve = async (disputeId: string, decision: 'freelancer_favor' | 'employer_favor') => {
    const reason = reasoning[disputeId]?.trim();
    if (!reason) {
      toast.error('Add resolution notes before resolving');
      return;
    }
    setResolvingId(disputeId);
    try {
      const { data: updated } = await disputesApi.resolve(disputeId, decision, reason);
      setViews((prev) => prev.map((v) => (v.dispute.id === disputeId ? { ...v, dispute: updated } : v)));
      toast.success('Dispute resolved');
    } catch {
      toast.error('Failed to resolve dispute — if this is unexpected, verify the admin account has the admin role on its JWT');
    } finally {
      setResolvingId(null);
    }
  };

  const byStatus = (status: DisputeStatus) => views.filter((v) => v.dispute.status === status);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
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
        <h1 className="text-2xl font-bold">Dispute Management</h1>
        <p className="text-muted-foreground">Resolve conflicts between freelancers and employers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
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
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
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
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
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
              <p className="text-sm text-muted-foreground py-12 text-center">No disputes here</p>
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

                  {dispute.evidence.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {dispute.evidence.map((ev) => (
                        <div key={ev.id} className="text-sm text-muted-foreground flex items-start gap-2">
                          <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                          {ev.type === 'text' ? (
                            <span>{ev.content}</span>
                          ) : (
                            <a href={ev.content} target="_blank" rel="noopener noreferrer" className="underline">
                              {ev.type === 'file' ? 'View file' : ev.content}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    {contract && <span className="font-medium text-primary">${contract.totalAmount.toLocaleString()}</span>}
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {dispute.evidence.length} evidence items
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
                          className="text-green-500 border-green-500/50"
                          disabled={resolvingId === dispute.id}
                          onClick={() => handleResolve(dispute.id, 'employer_favor')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Resolve in Favor of Employer
                        </Button>
                      </div>
                    </div>
                  )}

                  {dispute.status === 'resolved' && dispute.resolution && (
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                      <p className="text-sm text-green-500 flex items-center gap-2">
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
