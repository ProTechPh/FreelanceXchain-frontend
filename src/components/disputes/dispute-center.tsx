'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Eye,
  FileQuestion,
  FileText,
  Link2,
  Paperclip,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { reportFailure, reportLoadFailure } from '@/lib/report-failure';
import { contractsApi, disputesApi, milestonesApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { canUseDisputeActions, validateDisputeDraft, validateEvidenceLink, type DisputeDraft } from '@/lib/dispute-form';
import { safeAttachmentUrl } from '@/lib/attachment-presentation';
import { AttachmentPreviewDialog, type AttachmentPreviewTarget } from '@/components/ui/attachment-preview-dialog';
import { normalizeMilestone } from '@/lib/contract-workflow';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuthStore } from '@/stores/authStore';
import type { Contract, Dispute, DisputeEvidence, DisputeStatus, Milestone, UserRole } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListSkeleton } from '@/components/dashboard/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ALLOWED_FORMATS_DESCRIPTION,
  DOCUMENT_ACCEPT_STRING,
  isAllowedDocumentFile,
  MAX_FILE_SIZE,
} from '@/lib/file-validation';
import { formatDateTime } from '@/lib/format';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

type ParticipantRole = Extract<UserRole, 'employer' | 'freelancer'>;
const emptyDraft: DisputeDraft = { contractId: '', milestoneId: '', reason: '' };

const isApiOrUrl = (val?: string | null) =>
  Boolean(val && (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/api/') || val.includes('/files/access/')));

function getPartyInfo(
  userId: string | undefined | null,
  contract: Contract | null | undefined
): { name: string; role: 'Freelancer' | 'Employer' | 'Participant'; isFreelancer: boolean; isEmployer: boolean } {
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


const DisputeCenterInner = React.memo(function DisputeCenterInner({ role, disputeId }: { role: ParticipantRole; disputeId?: string }) {
  const user = useAuthStore((state) => state.user);
  const searchParams = useSearchParams();
  const contractIdParam = searchParams?.get('contractId') || '';

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [draft, setDraft] = useState<DisputeDraft>(() => ({
    contractId: contractIdParam,
    milestoneId: '',
    reason: '',
  }));
  const [evidenceText, setEvidenceText] = useState<Record<string, string>>({});
  const [evidenceLinks, setEvidenceLinks] = useState<Record<string, string>>({});
  const [evidenceFiles, setEvidenceFiles] = useState<Record<string, File | null>>({});
  const [evidenceByDispute, setEvidenceByDispute] = useState<Record<string, DisputeEvidence[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMilestones, setLoadingMilestones] = useState(() => Boolean(contractIdParam));
  const [actionId, setActionId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreviewTarget | null>(null);
  const [deletingEvidence, setDeletingEvidence] = useState<{ disputeId: string; evidenceId: string } | null>(null);
  const [selectedTab, setSelectedTab] = useState<'all' | DisputeStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(true);

  const verified = canUseDisputeActions(user?.kycStatus);
  const verificationPath = `/dashboard/${role}/verification`;

  useEffect(() => {
    if (!contractIdParam) return;
    let active = true;
    milestonesApi.listForContract(contractIdParam)
      .then(({ data }) => {
        if (active) {
          setMilestones(data.map(normalizeMilestone).filter((milestone) => milestone.status === 'submitted'));
        }
      })
      .catch((error) => {
        if (active) {
          reportFailure(error, 'load the submitted milestones');
        }
      })
      .finally(() => {
        if (active) {
          setLoadingMilestones(false);
        }
      });
    return () => {
      active = false;
    };
  }, [contractIdParam]);

  const load = useCallback(async () => {
    const [disputeItems, contractResponse] = await Promise.all([
      disputeId
        ? disputesApi
            .get(disputeId)
            .then(({ data }) => [data])
            .catch(async () => {
              // Fallback to finding the case in the user's accessible disputes list
              try {
                const listRes = await disputesApi.list({ limit: 100 });
                const found = listRes.data.items.find((d) => d.id === disputeId);
                if (found) return [found];
                if (listRes.data.items.length > 0) return [listRes.data.items[0]];
              } catch {}
              return [];
            })
        : disputesApi.list({ limit: 100 }).then(({ data }) => data.items),
      contractsApi.list({ limit: 100 }),
    ]);
    setDisputes(disputeItems);
    setContracts(contractResponse.data.items);
    const evidenceEntries = await Promise.all(disputeItems.map(async (dispute) => {
      const embeddedRecords: DisputeEvidence[] = (dispute.evidence || []).map((evidence) => ({
        id: evidence.id,
        disputeId: dispute.id,
        submittedBy: evidence.submitterId,
        evidenceType: evidence.type,
        description: evidence.content,
        fileUrl: evidence.type === 'text' ? undefined : evidence.content,
        createdAt: evidence.submittedAt,
        updatedAt: evidence.submittedAt,
      }));

      try {
        const { data } = await disputesApi.listEvidence(dispute.id);
        if (Array.isArray(data) && data.length > 0) {
          const ids = new Set(data.map((e) => e.id));
          const combined = [...data, ...embeddedRecords.filter((e) => !ids.has(e.id))];
          return [dispute.id, combined] as const;
        }
      } catch {
        // Fall back to embedded
      }

      return [dispute.id, embeddedRecords] as const;
    }));
    setEvidenceByDispute(Object.fromEntries(evidenceEntries));
  }, [disputeId]);

  useEffect(() => {
    let active = true;
    function run() {
      load()
        .catch((error) => {
          if (!active) return;
          reportLoadFailure(error, 'disputes', run);
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

  const activeContracts = contracts.filter((contract) => contract.status === 'active');
  const contractsById = useMemo(() => new Map(contracts.map((contract) => [contract.id, contract])), [contracts]);

  const stats = useMemo(() => {
    const total = disputes.length;
    const open = disputes.filter((d) => d.status === 'open').length;
    const underReview = disputes.filter((d) => d.status === 'under_review').length;
    const resolved = disputes.filter((d) => d.status === 'resolved').length;
    return { total, open, underReview, resolved };
  }, [disputes]);

  const filteredDisputes = useMemo(() => {
    return disputes.filter((dispute) => {
      if (selectedTab !== 'all' && dispute.status !== selectedTab) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const contract = contractsById.get(dispute.contractId);
      const contractTitle = (contract?.project?.title || contract?.title || '').toLowerCase();
      const reason = (dispute.reason || '').toLowerCase();
      const id = dispute.id.toLowerCase();
      const resolutionReason = (dispute.resolution?.reasoning || '').toLowerCase();
      const resolutionDecision = (dispute.resolution?.decision || '').toLowerCase();
      return (
        contractTitle.includes(q) ||
        reason.includes(q) ||
        id.includes(q) ||
        resolutionReason.includes(q) ||
        resolutionDecision.includes(q)
      );
    });
  }, [disputes, selectedTab, searchQuery, contractsById]);

  const selectContract = async (contractId: string) => {
    setDraft((current) => ({ contractId, milestoneId: '', reason: current.reason }));
    setMilestones([]);
    if (!contractId) return;

    setLoadingMilestones(true);
    try {
      const { data } = await milestonesApi.listForContract(contractId);
      setMilestones(data.map(normalizeMilestone).filter((milestone) => milestone.status === 'submitted'));
    } catch (error) {
      reportFailure(error, 'load the submitted milestones');
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
    if (!isAllowedDocumentFile(file)) {
      toast.error(`File type not allowed for "${file.name}". ${ALLOWED_FORMATS_DESCRIPTION}`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File "${file.name}" exceeds the 10 MB limit.`);
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
    setActionId(`delete:${evidenceId}`);
    try {
      await disputesApi.deleteEvidence(disputeId, evidenceId);
      setEvidenceByDispute((current) => ({ ...current, [disputeId]: (current[disputeId] ?? []).filter((evidence) => evidence.id !== evidenceId) }));
      setDisputes((current) => current.map((d) => d.id === disputeId ? { ...d, evidence: (d.evidence || []).filter((e) => e.id !== evidenceId) } : d));
      toast.success('Evidence deleted.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to delete this evidence.'));
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return <ListSkeleton rows={3} label="Loading disputes" />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {!verified && (
        <Card className="border-warning-border bg-warning-subtle">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm">
              <ShieldCheck className="size-5 text-warning shrink-0" />
              Identity verification is required to file a new dispute or submit evidence.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href={verificationPath}>Complete verification</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        {disputeId && (
          <div className="space-y-3 mb-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/dashboard/${role}`}>Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/dashboard/${role}/disputes`}>Disputes</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Case #{disputeId.slice(0, 8)}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground hover:text-foreground">
              <Link href={`/dashboard/${role}/disputes`}>
                <ArrowLeft className="mr-2 size-4" />Back to disputes
              </Link>
            </Button>
          </div>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{disputeId ? 'Dispute details' : 'Disputes'}</h1>
        <p className="text-muted-foreground">{disputeId ? 'Review the case, linked contract, resolution, and submitted evidence.' : 'Open a case for a submitted milestone and provide evidence for review.'}</p>
      </div>



      {!disputeId && (
        <Card className="border-border">
          <CardHeader
            className="cursor-pointer select-none transition-colors hover:bg-muted/20"
            onClick={() => setIsCreateOpen(!isCreateOpen)}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Plus className="size-5 text-primary" />
                  Open a dispute
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Escalate a submitted milestone to freeze funds in escrow and submit claims for arbitration review.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreateOpen(!isCreateOpen);
                }}
                aria-expanded={isCreateOpen}
              >
                {isCreateOpen ? (
                  <>
                    <ChevronUp className="size-4" />
                    <span>Hide form</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-4" />
                    <span>New dispute</span>
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {isCreateOpen && (
            <CardContent className="pt-0">
              {verified ? (
                <form className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border/60" onSubmit={createDispute}>
                  <div className="space-y-2">
                    <Label htmlFor="dispute-contract">Active contract</Label>
                    <select
                      id="dispute-contract"
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                      value={draft.contractId}
                      onChange={(event) => void selectContract(event.target.value)}
                    >
                      <option value="">Choose a contract</option>
                      {activeContracts.map((contract) => (
                        <option key={contract.id} value={contract.id}>
                          {contract.project?.title || contract.title || `Contract ${contract.id.slice(0, 8)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dispute-milestone">Submitted milestone</Label>
                    <select
                      id="dispute-milestone"
                      disabled={!draft.contractId || loadingMilestones}
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                      value={draft.milestoneId}
                      onChange={(event) => setDraft((current) => ({ ...current, milestoneId: event.target.value }))}
                    >
                      <option value="">{loadingMilestones ? 'Loading...' : 'Choose a milestone'}</option>
                      {milestones.map((milestone) => (
                        <option key={milestone.id} value={milestone.id}>
                          {milestone.title}
                        </option>
                      ))}
                    </select>
                    {draft.contractId && !loadingMilestones && milestones.length === 0 && (
                      <p className="text-xs text-warning">
                        No submitted milestones available for dispute. Only milestones currently under review (&apos;submitted&apos;) can be disputed.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="dispute-reason">Reason</Label>
                    <Textarea
                      id="dispute-reason"
                      rows={4}
                      maxLength={2000}
                      value={draft.reason}
                      onChange={(event) => setDraft((current) => ({ ...current, reason: event.target.value }))}
                      placeholder="Describe the problem and the resolution you are seeking."
                    />
                  </div>
                  <Button
                    className="sm:col-span-2 sm:w-fit"
                    type="submit"
                    disabled={actionId === 'create' || (Boolean(draft.contractId) && !loadingMilestones && milestones.length === 0)}
                  >
                    <Scale className="mr-2 size-4" />
                    {actionId === 'create' ? 'Opening...' : 'Open dispute'}
                  </Button>
                </form>
              ) : (
                <div className="pt-2 border-t border-border/60">
                  <p className="text-sm text-muted-foreground">
                    Identity verification is required before you can open a new dispute against funded contract milestones.
                  </p>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      <section className="space-y-4" aria-labelledby="cases-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="cases-heading" className="text-xl font-semibold tracking-tight text-foreground">
              {disputeId ? 'Case' : 'Your cases'}
            </h2>
            {!disputeId && (
              <p className="text-xs text-muted-foreground">
                Track active claims, submit evidence, and review arbitration outcomes categorized by status.
              </p>
            )}
          </div>

          {!disputeId && disputes.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Filter by title, reason, or case #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-8 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {!disputeId && (
          <Tabs value={selectedTab} onValueChange={(val) => setSelectedTab(val as typeof selectedTab)} className="w-full">
            <TabsList className="bg-muted/70 p-1 rounded-xl">
              <TabsTrigger value="all" className="gap-1.5 text-xs">
                All Cases <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">{stats.total}</Badge>
              </TabsTrigger>
              <TabsTrigger value="open" className="gap-1.5 text-xs">
                Open <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">{stats.open}</Badge>
              </TabsTrigger>
              <TabsTrigger value="under_review" className="gap-1.5 text-xs">
                Under Review <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">{stats.underReview}</Badge>
              </TabsTrigger>
              <TabsTrigger value="resolved" className="gap-1.5 text-xs">
                Resolved <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">{stats.resolved}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {filteredDisputes.length === 0 ? (
          <EmptyState
            icon={Scale}
            title={
              searchQuery
                ? "No matching disputes"
                : selectedTab === 'open'
                ? "No open disputes"
                : selectedTab === 'under_review'
                ? "No disputes under review"
                : selectedTab === 'resolved'
                ? "No resolved disputes"
                : "No disputes"
            }
            description={
              searchQuery
                ? `No cases match "${searchQuery}". Try searching with a different term.`
                : selectedTab === 'open'
                ? "You have no active disputes requiring evidence or immediate response."
                : selectedTab === 'under_review'
                ? "No cases are currently undergoing arbitration review."
                : selectedTab === 'resolved'
                ? "Settled disputes and formal rulings will appear here once resolved."
                : "Disputes appear here when either side raises an issue on a funded contract. Nothing needs your attention right now."
            }
          />
        ) : (
          filteredDisputes.map((dispute) => {
            const contract = contractsById.get(dispute.contractId);
            const milestone = contract?.milestones?.find((m) => m.id === dispute.milestoneId);
            const milestoneTitle = milestone?.title;
            const rawEmbedded: DisputeEvidence[] = (dispute.evidence || []).map((evidence) => ({
              id: evidence.id,
              disputeId: dispute.id,
              submittedBy: evidence.submitterId,
              evidenceType: evidence.type,
              description: evidence.content,
              fileUrl: evidence.type === 'text' ? undefined : evidence.content,
              createdAt: evidence.submittedAt,
              updatedAt: evidence.submittedAt,
            }));
            const standaloneRecords = evidenceByDispute[dispute.id] || [];
            const seenIds = new Set(standaloneRecords.map((e) => e.id));
            const evidenceRecords = [
              ...standaloneRecords,
              ...rawEmbedded.filter((e) => !seenIds.has(e.id)),
            ];

            const initiatorInfo = getPartyInfo(dispute.initiatorId, contract);

            return (
              <Card key={dispute.id} className="overflow-hidden border-border bg-card shadow-sm transition-all hover:border-border/80">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-5 py-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={dispute.status} domain="dispute" />
                    <span className="text-muted-foreground">•</span>
                    <Badge variant="outline" className="font-medium text-xs border-border/80 bg-background/60">
                      {dispute.status === 'open' && 'Category: Open / Action Required'}
                      {dispute.status === 'under_review' && 'Category: In Arbitration Review'}
                      {dispute.status === 'resolved' && 'Category: Resolved & Closed'}
                    </Badge>
                    {milestoneTitle && (
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        Milestone: <strong className="font-medium text-foreground">{milestoneTitle}</strong>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono">
                    <span>Ref: #{dispute.id.slice(0, 8)}</span>
                    <span>•</span>
                    <span className="font-sans">Opened {formatDateTime(dispute.createdAt)}</span>
                  </div>
                </div>

                <CardHeader className="pb-3 pt-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold">
                        <Link
                          href={`/dashboard/${role}/contracts/${dispute.contractId}?disputeId=${dispute.id}`}
                          className="hover:text-primary transition-colors hover:underline"
                        >
                          {contract?.project?.title || contract?.title || `Contract ${dispute.contractId.slice(0, 8)}`}
                        </Link>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Contract ref: <span className="font-mono">{dispute.contractId.slice(0, 8)}</span>
                        {milestoneTitle && <span className="sm:hidden"> • Milestone: {milestoneTitle}</span>}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/${role}/contracts/${dispute.contractId}?disputeId=${dispute.id}`}>
                          View contract
                        </Link>
                      </Button>
                      {!disputeId && (
                        <Button asChild variant="secondary" size="sm">
                          <Link href={`/dashboard/${role}/disputes/${dispute.id}`}>
                            View case
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <div className="rounded-lg border border-border/80 bg-muted/40 p-3.5 text-sm space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground">
                        <FileQuestion className="size-3.5 text-primary shrink-0" />
                        <span>Dispute Claim</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-2xs font-medium px-1.5 py-0",
                          initiatorInfo.isFreelancer
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                            : initiatorInfo.isEmployer
                            ? "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300"
                            : "border-border bg-secondary"
                        )}
                      >
                        <User className="w-2.5 h-2.5 mr-1" />
                        Disputed by {initiatorInfo.name} ({initiatorInfo.role})
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground pl-5 leading-relaxed">
                      <span className="font-medium">Reason:</span> {dispute.reason}
                    </p>
                  </div>

                {/* Evidence and Attachments Section */}
                <div className="space-y-3 pt-3 border-t border-border" data-testid="dispute-evidence-section">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Paperclip className="size-4 text-muted-foreground" />
                      Evidence &amp; attachments
                    </h3>
                    {evidenceRecords.length > 0 && (
                      <Badge variant="outline" className="text-xs font-normal">
                        {evidenceRecords.length} {evidenceRecords.length === 1 ? 'attachment' : 'attachments'}
                      </Badge>
                    )}
                  </div>

                  {evidenceRecords.length === 0 ? (
                    disputeId ? (
                      <p className="text-xs text-muted-foreground">No evidence attachments have been submitted for this case.</p>
                    ) : null
                  ) : (
                    <ul className="space-y-2" aria-label="Submitted evidence">
                      {evidenceRecords.map((evidence) => {
                        const rawTarget = evidence.fileUrl || evidence.description;
                        const safeUrl = safeAttachmentUrl(rawTarget);
                        const directUrl = safeUrl || (rawTarget && (rawTarget.startsWith('http://') || rawTarget.startsWith('https://') || rawTarget.startsWith('/')) ? rawTarget : null);
                        const textOnly = evidence.evidenceType === 'text' || evidence.evidenceType === 'message';
                        const submitterInfo = getPartyInfo(evidence.submittedBy, contract);

                        // Derive readable file/attachment name
                        const cleanDescription = (!isApiOrUrl(evidence.description) && evidence.description?.trim()) ? evidence.description : null;
                        const candidateName = cleanDescription || (directUrl ? directUrl.split('/').pop()?.split('?')[0] : null) || 'Evidence file';
                        const fileName = cleanDescription || (/^[a-f0-9]{16,}$/i.test(candidateName.split('.')[0] || '') ? 'Evidence file' : candidateName);

                        return (
                          <li key={evidence.id} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                            <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium capitalize">{evidence.evidenceType} evidence</span>
                                  <Badge variant="secondary">{evidence.verifiedBy ? 'Verified' : 'Unverified'}</Badge>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <span>Uploaded by:</span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-2xs font-normal",
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
                              </div>
                              {textOnly ? (
                                <p className="mt-1 break-words text-muted-foreground">{evidence.description}</p>
                              ) : evidence.evidenceType === 'link' ? (
                                <div className="mt-1">
                                  <a
                                    href={directUrl || evidence.description}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Open evidence"
                                    className="inline-flex items-center gap-1.5 break-all text-xs font-medium text-primary hover:underline"
                                  >
                                    <ExternalLink className="size-3.5 shrink-0" />
                                    <span>{evidence.description}</span>
                                  </a>
                                </div>
                              ) : (
                                <div className="mt-1 space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {directUrl ? (
                                      <a
                                        href={directUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setPreviewAttachment({
                                            filename: fileName,
                                            url: directUrl,
                                          });
                                        }}
                                        aria-label={`Evidence file: ${fileName}`}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline break-all text-left cursor-pointer"
                                      >
                                        <Paperclip className="size-3.5 shrink-0" />
                                        <span>{fileName}</span>
                                      </a>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground break-all">
                                        <Paperclip className="size-3.5 shrink-0" />
                                        <span>{fileName}</span>
                                      </span>
                                    )}
                                  </div>
                                  {directUrl && (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 gap-1.5 px-2.5 text-xs rounded-lg"
                                        onClick={() =>
                                          setPreviewAttachment({
                                            filename: fileName,
                                            url: directUrl,
                                          })
                                        }
                                      >
                                        <Eye className="size-3.5" />
                                        View evidence
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            {evidence.submittedBy === user?.id && !evidence.verifiedBy && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label={`Delete ${evidence.evidenceType} evidence`}
                                disabled={actionId === `delete:${evidence.id}`}
                                onClick={() => setDeletingEvidence({ disputeId: dispute.id, evidenceId: evidence.id })}
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {dispute.status !== 'resolved' && (
                  verified ? (
                    <div className="grid gap-4 rounded-lg border border-border p-4 lg:grid-cols-3">
                      <div className="space-y-2"><Label htmlFor={`evidence-text-${dispute.id}`}>Evidence notes</Label><Textarea id={`evidence-text-${dispute.id}`} maxLength={2000} value={evidenceText[dispute.id] ?? ''} onChange={(event) => setEvidenceText((current) => ({ ...current, [dispute.id]: event.target.value }))} /><Button type="button" size="sm" disabled={actionId === `evidence:${dispute.id}`} onClick={() => void submitTextEvidence(dispute.id)}>Submit notes</Button></div>
                      <div className="space-y-2">
                        <Label htmlFor={`evidence-file-${dispute.id}`}>Evidence file</Label>
                        <Input
                          id={`evidence-file-${dispute.id}`}
                          type="file"
                          accept={DOCUMENT_ACCEPT_STRING}
                          onChange={(event) => {
                            const picked = event.target.files?.[0] ?? null;
                            if (picked) {
                              if (!isAllowedDocumentFile(picked)) {
                                toast.error(`File type not allowed for "${picked.name}". ${ALLOWED_FORMATS_DESCRIPTION}`);
                                event.target.value = '';
                                return;
                              }
                              if (picked.size > MAX_FILE_SIZE) {
                                toast.error(`File "${picked.name}" exceeds the 10 MB limit.`);
                                event.target.value = '';
                                return;
                              }
                            }
                            setEvidenceFiles((current) => ({ ...current, [dispute.id]: picked }));
                          }}
                        />
                        <Button type="button" size="sm" variant="outline" disabled={actionId === `file:${dispute.id}`} onClick={() => void submitFileEvidence(dispute.id)}>
                          <Upload className="mr-2 size-4" />Upload file
                        </Button>
                      </div>
                      <div className="space-y-2"><Label htmlFor={`evidence-link-${dispute.id}`}>Evidence link</Label><Input id={`evidence-link-${dispute.id}`} type="url" placeholder="https://..." value={evidenceLinks[dispute.id] ?? ''} onChange={(event) => setEvidenceLinks((current) => ({ ...current, [dispute.id]: event.target.value }))} /><Button type="button" size="sm" variant="outline" disabled={actionId === `link:${dispute.id}`} onClick={() => void submitLinkEvidence(dispute.id)}><Link2 className="mr-2 size-4" />Submit link</Button></div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span>Complete KYC verification to submit evidence notes, documents, or links for this dispute.</span>
                      <Button asChild size="sm" variant="outline" className="text-xs h-7 shrink-0 w-fit">
                        <Link href={verificationPath}>Verify identity</Link>
                      </Button>
                    </div>
                  )
                )}

                {dispute.status === 'resolved' && dispute.resolution && (
                  <div className="rounded-lg border border-success-border bg-success-subtle p-3.5 text-sm space-y-1.5">
                    <div className="flex items-center gap-2 font-semibold text-success">
                      <CheckCircle className="size-4 shrink-0" />
                      <p className="font-medium">Resolution: {dispute.resolution.decision.replace('_', ' ')}</p>
                    </div>
                    <p className="mt-1 text-sm text-foreground/80 pl-6 leading-relaxed">{dispute.resolution.reasoning}</p>
                  </div>
                )}

                {/* Dispute Resolution Timeline */}
                <div className="space-y-3 pt-3 border-t border-border" data-testid="dispute-timeline">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    Dispute resolution timeline
                  </h3>
                  <ol className="relative ml-2 space-y-4 border-l border-border pl-4 text-sm">
                    <li className="relative space-y-1">
                      <div className="absolute -left-[21px] mt-1.5 size-2.5 rounded-full border border-background bg-primary" />
                      <p className="font-medium text-foreground">Dispute opened</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(dispute.createdAt)}</p>
                      <p className="text-xs text-muted-foreground">Case filed citing milestone deliverable concerns.</p>
                    </li>
                    {evidenceRecords.map((ev, idx) => {
                      const rawTarget = ev.fileUrl || ev.description;
                      const safeUrl = safeAttachmentUrl(rawTarget);
                      const directUrl = safeUrl || (rawTarget && (rawTarget.startsWith('http://') || rawTarget.startsWith('https://') || rawTarget.startsWith('/')) ? rawTarget : null);
                      const cleanDescription = (!isApiOrUrl(ev.description) && ev.description?.trim()) ? ev.description : null;
                      const candidateName = cleanDescription || (directUrl ? directUrl.split('/').pop()?.split('?')[0] : null) || 'Evidence file';
                      const fileName = cleanDescription || (/^[a-f0-9]{16,}$/i.test(candidateName.split('.')[0] || '') ? 'Evidence file' : candidateName);

                      return (
                        <li key={ev.id || idx} className="relative space-y-1">
                          <div className="absolute -left-[21px] mt-1.5 size-2.5 rounded-full border border-background bg-primary/70" />
                          <p className="font-medium text-foreground capitalize">{ev.evidenceType} evidence submitted</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(ev.createdAt)}</p>
                          {cleanDescription && (
                            <p className="text-xs text-muted-foreground break-words">{cleanDescription}</p>
                          )}
                          {ev.evidenceType !== 'text' && ev.evidenceType !== 'message' && (
                            <div className="pt-0.5">
                              {directUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewAttachment({ filename: fileName, url: directUrl })}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline break-all text-left cursor-pointer"
                                >
                                  <Paperclip className="size-3 shrink-0" />
                                  <span>{fileName}</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground break-all">
                                  <Paperclip className="size-3 shrink-0" />
                                  <span>{fileName}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                    {dispute.status === 'resolved' && dispute.resolution ? (
                      <li className="relative space-y-1">
                        <div className="absolute -left-[21px] mt-1.5 size-2.5 rounded-full border border-background bg-success" />
                        <p className="font-medium text-success capitalize">Dispute resolved ({dispute.resolution.decision.replace('_', ' ')})</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(dispute.resolution.resolvedAt || dispute.updatedAt)}</p>
                        <p className="text-xs text-muted-foreground">{dispute.resolution.reasoning}</p>
                      </li>
                    ) : (
                      <li className="relative space-y-1">
                        <div className="absolute -left-[21px] mt-1.5 size-2.5 rounded-full border border-background bg-warning animate-pulse" />
                        <p className="font-medium text-warning capitalize">{dispute.status === 'under_review' ? 'Arbitration under review' : 'Awaiting arbitration review'}</p>
                        <p className="text-xs text-muted-foreground">Arbitrators evaluate submitted claims and evidence before delivering a binding decision.</p>
                      </li>
                    )}
                  </ol>
                </div>
              </CardContent>
            </Card>
          );
        }))}
      </section>

      <AttachmentPreviewDialog
        open={Boolean(previewAttachment)}
        onOpenChange={(open) => {
          if (!open) setPreviewAttachment(null);
        }}
        attachment={previewAttachment}
      />

      <Dialog open={Boolean(deletingEvidence)} onOpenChange={(open) => !open && setDeletingEvidence(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Evidence</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this unverified evidence? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingEvidence(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingEvidence) {
                  void deleteEvidence(deletingEvidence.disputeId, deletingEvidence.evidenceId);
                }
                setDeletingEvidence(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export function DisputeCenter(props: { role: ParticipantRole; disputeId?: string }) {
  return (
    <Suspense fallback={<ListSkeleton rows={3} label="Loading disputes" />}>
      <DisputeCenterInner {...props} />
    </Suspense>
  );
}
