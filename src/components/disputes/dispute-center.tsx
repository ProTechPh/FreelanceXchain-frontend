'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Link2, Loader2, Plus, Scale, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { contractsApi, disputesApi, milestonesApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { canUseDisputeActions, validateDisputeDraft, validateEvidenceLink, type DisputeDraft } from '@/lib/dispute-form';
import { safeAttachmentUrl } from '@/lib/attachment-presentation';
import { normalizeMilestone } from '@/lib/contract-workflow';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuthStore } from '@/stores/authStore';
import type { Contract, Dispute, DisputeEvidence, Milestone, UserRole } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ParticipantRole = Extract<UserRole, 'employer' | 'freelancer'>;
const emptyDraft: DisputeDraft = { contractId: '', milestoneId: '', reason: '' };

export function DisputeCenter({ role, disputeId }: { role: ParticipantRole; disputeId?: string }) {
  const user = useAuthStore((state) => state.user);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [draft, setDraft] = useState<DisputeDraft>(emptyDraft);
  const [evidenceText, setEvidenceText] = useState<Record<string, string>>({});
  const [evidenceLinks, setEvidenceLinks] = useState<Record<string, string>>({});
  const [evidenceFiles, setEvidenceFiles] = useState<Record<string, File | null>>({});
  const [evidenceByDispute, setEvidenceByDispute] = useState<Record<string, DisputeEvidence[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const verified = canUseDisputeActions(user?.kycStatus);
  const verificationPath = `/dashboard/${role}/verification`;

  const load = useCallback(async () => {
    if (!verified) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [disputeItems, contractResponse] = await Promise.all([
        disputeId
          ? disputesApi.get(disputeId).then(({ data }) => [data])
          : disputesApi.list({ limit: 100 }).then(({ data }) => data.items),
        contractsApi.list({ limit: 100 }),
      ]);
      setDisputes(disputeItems);
      setContracts(contractResponse.data.items);
      const evidenceEntries = await Promise.all(disputeItems.map(async (dispute) => {
        try {
          const { data } = await disputesApi.listEvidence(dispute.id);
          return [dispute.id, data] as const;
        } catch {
          return [dispute.id, dispute.evidence.map((evidence) => ({
            id: evidence.id,
            disputeId: dispute.id,
            submittedBy: evidence.submitterId,
            evidenceType: evidence.type,
            description: evidence.content,
            fileUrl: evidence.type === 'text' ? undefined : evidence.content,
            createdAt: evidence.submittedAt,
            updatedAt: evidence.submittedAt,
          }))] as const;
        }
      }));
      setEvidenceByDispute(Object.fromEntries(evidenceEntries));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to load disputes.'));
    } finally {
      setLoading(false);
    }
  }, [disputeId, verified]);

  useEffect(() => {
    // Dispute data is available only after the authenticated user's KYC state is known.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const activeContracts = contracts.filter((contract) => contract.status === 'active');
  const contractsById = useMemo(() => new Map(contracts.map((contract) => [contract.id, contract])), [contracts]);

  const selectContract = async (contractId: string) => {
    setDraft({ contractId, milestoneId: '', reason: draft.reason });
    setMilestones([]);
    if (!contractId) return;

    setLoadingMilestones(true);
    try {
      const { data } = await milestonesApi.listForContract(contractId);
      setMilestones(data.map(normalizeMilestone).filter((milestone) => milestone.status === 'submitted'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to load submitted milestones.'));
    } finally {
      setLoadingMilestones(false);
    }
  };

  const refreshEvidence = async (disputeId: string) => {
    try {
      const { data } = await disputesApi.listEvidence(disputeId);
      setEvidenceByDispute((current) => ({ ...current, [disputeId]: data }));
    } catch {
      // The embedded dispute response remains visible if the standalone evidence read is unavailable.
    }
  };

  const createDispute = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = validateDisputeDraft(draft);
    if (error) {
      toast.error(error);
      return;
    }

    setActionId('create');
    try {
      const { data } = await disputesApi.create({ ...draft, reason: draft.reason.trim() });
      setDisputes((current) => [data, ...current]);
      setDraft(emptyDraft);
      setMilestones([]);
      toast.success('Dispute opened and milestone funds locked.');
    } catch (apiError) {
      toast.error(getApiErrorMessage(apiError, 'Unable to open this dispute.'));
    } finally {
      setActionId(null);
    }
  };

  const submitTextEvidence = async (disputeId: string) => {
    const content = evidenceText[disputeId]?.trim();
    if (!content) {
      toast.error('Enter evidence notes before submitting.');
      return;
    }
    setActionId(`evidence:${disputeId}`);
    try {
      const { data } = await disputesApi.submitEvidence(disputeId, 'text', content);
      setDisputes((current) => current.map((dispute) => dispute.id === disputeId ? data : dispute));
      await refreshEvidence(disputeId);
      setEvidenceText((current) => ({ ...current, [disputeId]: '' }));
      toast.success('Evidence submitted.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to submit evidence.'));
    } finally {
      setActionId(null);
    }
  };

  const submitLinkEvidence = async (disputeId: string) => {
    const value = evidenceLinks[disputeId] ?? '';
    const error = validateEvidenceLink(value);
    if (error) {
      toast.error(error);
      return;
    }
    setActionId(`link:${disputeId}`);
    try {
      const { data } = await disputesApi.submitEvidence(disputeId, 'link', value.trim());
      setDisputes((current) => current.map((dispute) => dispute.id === disputeId ? data : dispute));
      await refreshEvidence(disputeId);
      setEvidenceLinks((current) => ({ ...current, [disputeId]: '' }));
      toast.success('Evidence link submitted.');
    } catch (apiError) {
      toast.error(getApiErrorMessage(apiError, 'Unable to submit the evidence link.'));
    } finally {
      setActionId(null);
    }
  };

  const submitFileEvidence = async (disputeId: string) => {
    const file = evidenceFiles[disputeId];
    if (!file) {
      toast.error('Choose an evidence file first.');
      return;
    }
    const formData = new FormData();
    formData.append('type', 'file');
    formData.append('files', file);
    setActionId(`file:${disputeId}`);
    try {
      const { data } = await disputesApi.submitEvidenceFiles(disputeId, formData);
      setDisputes((current) => current.map((dispute) => dispute.id === disputeId ? data : dispute));
      await refreshEvidence(disputeId);
      setEvidenceFiles((current) => ({ ...current, [disputeId]: null }));
      toast.success('Evidence file uploaded.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to upload evidence.'));
    } finally {
      setActionId(null);
    }
  };

  const deleteEvidence = async (disputeId: string, evidenceId: string) => {
    if (!window.confirm('Delete this unverified evidence?')) return;
    setActionId(`delete:${evidenceId}`);
    try {
      await disputesApi.deleteEvidence(disputeId, evidenceId);
      setEvidenceByDispute((current) => ({ ...current, [disputeId]: (current[disputeId] ?? []).filter((evidence) => evidence.id !== evidenceId) }));
      toast.success('Evidence deleted.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to delete this evidence.'));
    } finally {
      setActionId(null);
    }
  };

  if (!verified) {
    return (
      <Card className="border-warning-border bg-warning-subtle"><CardContent className="flex flex-col items-center gap-4 py-12 text-center"><ShieldCheck className="size-10 text-warning" /><div><h1 className="text-xl font-semibold">Verification required</h1><p className="mt-1 text-muted-foreground">The backend requires verified identity before disputes can be viewed or submitted.</p></div><Button asChild><Link href={verificationPath}>Complete verification</Link></Button></CardContent></Card>
    );
  }

  if (loading) {
    return <div className="flex min-h-64 items-center justify-center" role="status" aria-label="Loading disputes"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        {disputeId && <Button asChild variant="ghost" className="-ml-3 mb-2"><Link href={`/dashboard/${role}/disputes`}>Back to disputes</Link></Button>}
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{disputeId ? 'Dispute details' : 'Disputes'}</h1>
        <p className="text-muted-foreground">{disputeId ? 'Review the case, linked contract, resolution, and submitted evidence.' : 'Open a case for a submitted milestone and provide evidence for review.'}</p>
      </div>

      {!disputeId && <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-5" />Open a dispute</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={createDispute}>
            <div className="space-y-2"><Label htmlFor="dispute-contract">Active contract</Label><select id="dispute-contract" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={draft.contractId} onChange={(event) => void selectContract(event.target.value)}><option value="">Choose a contract</option>{activeContracts.map((contract) => <option key={contract.id} value={contract.id}>{contract.project?.title || contract.title || `Contract ${contract.id.slice(0, 8)}`}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="dispute-milestone">Submitted milestone</Label><select id="dispute-milestone" disabled={!draft.contractId || loadingMilestones} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={draft.milestoneId} onChange={(event) => setDraft((current) => ({ ...current, milestoneId: event.target.value }))}><option value="">{loadingMilestones ? 'Loading…' : 'Choose a milestone'}</option>{milestones.map((milestone) => <option key={milestone.id} value={milestone.id}>{milestone.title}</option>)}</select></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="dispute-reason">Reason</Label><Textarea id="dispute-reason" rows={4} value={draft.reason} onChange={(event) => setDraft((current) => ({ ...current, reason: event.target.value }))} placeholder="Describe the problem and the resolution you are seeking." /></div>
            <Button className="sm:col-span-2 sm:w-fit" type="submit" disabled={actionId === 'create'}><Scale className="mr-2 size-4" />{actionId === 'create' ? 'Opening…' : 'Open dispute'}</Button>
          </form>
        </CardContent>
      </Card>}

      <section className="space-y-4" aria-labelledby="cases-heading">
        <h2 id="cases-heading" className="text-xl font-semibold">{disputeId ? 'Case' : 'Your cases'}</h2>
        {disputes.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">No disputes found.</CardContent></Card>}
        {disputes.map((dispute) => {
          const contract = contractsById.get(dispute.contractId);
          const evidenceRecords = evidenceByDispute[dispute.id] ?? [];
          return (
            <Card key={dispute.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base">{contract?.project?.title || contract?.title || `Contract ${dispute.contractId.slice(0, 8)}`}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Opened {new Date(dispute.createdAt).toLocaleString()}</p></div><StatusBadge status={dispute.status} domain="dispute" /></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="rounded-lg bg-muted p-3 text-sm"><span className="font-medium">Reason:</span> {dispute.reason}</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm"><Link href={`/dashboard/${role}/contracts/${dispute.contractId}`}>View contract</Link></Button>
                  {!disputeId && <Button asChild variant="ghost" size="sm"><Link href={`/dashboard/${role}/disputes/${dispute.id}`}>View case</Link></Button>}
                </div>

                {evidenceRecords.length > 0 && (
                  <ul className="space-y-2" aria-label="Submitted evidence">
                    {evidenceRecords.map((evidence) => {
                      const evidenceUrl = safeAttachmentUrl(evidence.fileUrl || evidence.description);
                      const textOnly = evidence.evidenceType === 'text' || evidence.evidenceType === 'message';
                      return <li key={evidence.id} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm"><FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-medium capitalize">{evidence.evidenceType} evidence</span><Badge variant="secondary">{evidence.verifiedBy ? 'Verified' : 'Unverified'}</Badge></div>{textOnly ? <p className="mt-1 break-words text-muted-foreground">{evidence.description}</p> : evidenceUrl ? <a href={evidenceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-primary underline">Open evidence</a> : <p className="mt-1 break-words text-muted-foreground">Attachment unavailable</p>}</div>{evidence.submittedBy === user?.id && !evidence.verifiedBy && <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${evidence.evidenceType} evidence`} disabled={actionId === `delete:${evidence.id}`} onClick={() => void deleteEvidence(dispute.id, evidence.id)}><Trash2 className="size-4 text-destructive" /></Button>}</li>;
                    })}
                  </ul>
                )}

                {dispute.status !== 'resolved' && (
                  <div className="grid gap-4 rounded-lg border border-border p-4 lg:grid-cols-3">
                    <div className="space-y-2"><Label htmlFor={`evidence-text-${dispute.id}`}>Evidence notes</Label><Textarea id={`evidence-text-${dispute.id}`} value={evidenceText[dispute.id] ?? ''} onChange={(event) => setEvidenceText((current) => ({ ...current, [dispute.id]: event.target.value }))} /><Button type="button" size="sm" disabled={actionId === `evidence:${dispute.id}`} onClick={() => void submitTextEvidence(dispute.id)}>Submit notes</Button></div>
                    <div className="space-y-2"><Label htmlFor={`evidence-file-${dispute.id}`}>Evidence file</Label><Input id={`evidence-file-${dispute.id}`} type="file" onChange={(event) => setEvidenceFiles((current) => ({ ...current, [dispute.id]: event.target.files?.[0] ?? null }))} /><Button type="button" size="sm" variant="outline" disabled={actionId === `file:${dispute.id}`} onClick={() => void submitFileEvidence(dispute.id)}><Upload className="mr-2 size-4" />Upload file</Button></div>
                    <div className="space-y-2"><Label htmlFor={`evidence-link-${dispute.id}`}>Evidence link</Label><Input id={`evidence-link-${dispute.id}`} type="url" placeholder="https://…" value={evidenceLinks[dispute.id] ?? ''} onChange={(event) => setEvidenceLinks((current) => ({ ...current, [dispute.id]: event.target.value }))} /><Button type="button" size="sm" variant="outline" disabled={actionId === `link:${dispute.id}`} onClick={() => void submitLinkEvidence(dispute.id)}><Link2 className="mr-2 size-4" />Submit link</Button></div>
                  </div>
                )}

                {dispute.status === 'resolved' && dispute.resolution && <div className="rounded-lg border border-success-border bg-success-subtle p-3 text-sm"><p className="font-medium">Resolution: {dispute.resolution.decision.replace('_', ' ')}</p><p className="mt-1 text-muted-foreground">{dispute.resolution.reasoning}</p></div>}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
