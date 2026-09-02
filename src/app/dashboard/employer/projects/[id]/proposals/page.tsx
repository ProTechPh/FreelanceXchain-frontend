'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  Paperclip,
  SearchX,
  X,
  Sparkles,
  ShieldCheck,
  Star,
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { reportFailure } from '@/lib/report-failure';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Markdown } from '@/components/ui/markdown';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { freelancersApi, matchingApi, projectsApi, proposalsApi, type FreelancerRecommendation } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { formatFileSize, safeAttachmentUrl } from '@/lib/attachment-presentation';
import {
  updateProposalDecision,
  type ProposalDecision,
} from '@/lib/proposal-management';
import { StatusBadge } from '@/components/ui/status-badge';
import { getDirectMessageRoute } from '@/lib/dashboard-message-route';
import { AttachmentPreviewDialog, type AttachmentPreviewTarget } from '@/components/ui/attachment-preview-dialog';
import type { FreelancerProfile, Project, Proposal } from '@/types';
import { ListSkeleton } from '@/components/dashboard/skeletons';

interface PendingDecision {
  proposal: Proposal;
  action: ProposalDecision;
}

export default function EmployerProjectProposalsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id;
  const [project, setProject] = useState<Project | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [profiles, setProfiles] = useState<Record<string, FreelancerProfile | null>>({});
  const [recommendations, setRecommendations] = useState<FreelancerRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [decision, setDecision] = useState<PendingDecision | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreviewTarget | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;

    try {
      // 1. Fetch core project and proposals first to immediately unblock the UI
      const [projectResponse, proposalResponse] = await Promise.all([
        projectsApi.get(projectId),
        projectsApi.getProposals(projectId),
      ]);
      const loadedProposals = proposalResponse.data.items;
      const uniqueProposals = loadedProposals.filter(
        (proposal, index, self) => index === self.findIndex((p) => p.id === proposal.id),
      );

      const proposalFreelancerIds = [...new Set(uniqueProposals.map((p) => p.freelancerId))];
      const initialProfileEntries = await Promise.all(
        proposalFreelancerIds.map(async (freelancerId) => {
          try {
            const response = await freelancersApi.getPublicProfile(freelancerId);
            return [freelancerId, response.data] as const;
          } catch {
            return [freelancerId, null] as const;
          }
        }),
      );

      setProject(projectResponse.data);
      setProposals(uniqueProposals);
      setProfiles((prev) => ({ ...prev, ...Object.fromEntries(initialProfileEntries) }));
      setLoading(false);

      // 2. Fetch recommendations progressively in background
      setRecommendationsLoading(true);
      try {
        const recRes = await matchingApi.getFreelancerRecommendations(projectId, 5);
        const uniqueRecs = (recRes.data || []).filter(
          (rec, index, self) => index === self.findIndex((r) => r.freelancerId === rec.freelancerId),
        );
        setRecommendations(uniqueRecs);

        const missingRecIds = uniqueRecs
          .map((r) => r.freelancerId)
          .filter((id) => !proposalFreelancerIds.includes(id));

        if (missingRecIds.length > 0) {
          const recProfileEntries = await Promise.all(
            missingRecIds.map(async (freelancerId) => {
              try {
                const response = await freelancersApi.getPublicProfile(freelancerId);
                return [freelancerId, response.data] as const;
              } catch {
                return [freelancerId, null] as const;
              }
            }),
          );
          setProfiles((prev) => ({ ...prev, ...Object.fromEntries(recProfileEntries) }));
        }
      } catch {
        setRecommendations([]);
      } finally {
        setRecommendationsLoading(false);
      }
    } catch (error) {
      reportFailure(error, 'load the proposals for this project');
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const pendingCount = useMemo(
    () => proposals.filter((proposal) => proposal.status === 'pending').length,
    [proposals],
  );

  const confirmDecision = async () => {
    if (!decision || !projectId) return;

    setUpdating(true);
    try {
      await updateProposalDecision(proposalsApi, decision.proposal.id, decision.action);
      const { data } = await projectsApi.getProposals(projectId);
      setProposals(data.items);
      toast.success(
        decision.action === 'accept'
          ? 'Proposal accepted and contract created'
          : 'Proposal rejected',
      );
      setDecision(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Failed to ${decision.action} proposal`));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <ListSkeleton rows={4} label="Loading proposals" />
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <SearchX className="h-10 w-10 text-muted-foreground" />
        <p className="font-medium">Project proposals could not be loaded</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/employer/projects">Back to projects</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2 text-muted-foreground hover:text-foreground">
            <Link href={`/dashboard/employer/projects/${project.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to project
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Project proposals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review applicant proposals and AI matches for <span className="font-semibold text-foreground">“{project.title}”</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="h-8 px-3 text-xs">
            {proposals.length} Submitted
          </Badge>
          <Badge className="h-8 bg-warning-subtle text-warning border-warning/30 px-3 text-xs font-semibold">
            {pendingCount} Pending Review
          </Badge>
          <Badge variant="secondary" className="h-8 px-3 text-xs font-semibold text-primary">
            {project.budget.toLocaleString()} ETH Budget
          </Badge>
        </div>
      </div>

      {/* Recommended Talent (AI Matches) */}
      {(recommendationsLoading || recommendations.length > 0) && (
        <Card className="border border-primary/20 bg-primary/5 shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b border-primary/10 bg-primary/10 flex flex-row items-center justify-between gap-2 space-y-0">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="size-4 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Recommended talent</span>
                  <Badge variant="secondary" className="text-3xs bg-primary/10 text-primary border-primary/20">
                    {recommendationsLoading ? 'Matching…' : `${recommendations.length} Available`}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Pre-screened verified freelancers whose skills fit this project.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => setShowRecommendations((prev) => !prev)}
            >
              {showRecommendations ? (
                <>
                  <span>Hide</span>
                  <ChevronUp className="size-3.5" />
                </>
              ) : (
                <>
                  <span>Show</span>
                  <ChevronDown className="size-3.5" />
                </>
              )}
            </Button>
          </CardHeader>

          {showRecommendations && (
            <CardContent className="pt-4">
              {recommendationsLoading ? (
                <div className="grid gap-3 lg:grid-cols-2" role="status" aria-label="Loading talent recommendations">
                  <Skeleton className="h-44 rounded-xl" />
                  <Skeleton className="h-44 rounded-xl" />
                </div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {recommendations.map((recommendation, idx) => {
                    const profile = profiles[recommendation.freelancerId];
                    const name = profile?.name || `Freelancer ${recommendation.freelancerId.slice(0, 8)}`;
                    const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'FL';

                    return (
                      <div
                        key={`${recommendation.freelancerId}-${idx}`}
                        className="rounded-xl border border-border/80 bg-card p-4 shadow-xs flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-foreground truncate">{name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {recommendation.totalRatings && recommendation.totalRatings > 0 ? (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Star className="size-3 text-warning fill-warning" />
                                      <span className="font-semibold text-foreground">
                                        {(recommendation.averageRating ?? (recommendation.reputationScore / 20)).toFixed(1)}
                                      </span>
                                      <span>({recommendation.totalRatings} review{recommendation.totalRatings === 1 ? '' : 's'})</span>
                                    </span>
                                  ) : recommendation.reputationScore > 0 ? (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Star className="size-3 text-warning fill-warning" />
                                      <span className="font-semibold text-foreground">{(recommendation.reputationScore / 20).toFixed(1)}</span>
                                      <span>({Math.round(recommendation.reputationScore)}% rep)</span>
                                    </span>
                                  ) : (
                                    <Badge variant="secondary" className="text-3xs bg-secondary/60 text-muted-foreground py-0">
                                      New Talent · Unrated
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Badge className="bg-success-subtle text-success border border-success/30 font-semibold text-xs shrink-0">
                              {Math.round(recommendation.combinedScore)}% fit
                            </Badge>
                          </div>

                          {/* Matched Skills */}
                          <div className="flex flex-wrap gap-1.5">
                            {recommendation.matchedSkills.map((skill, skillIdx) => (
                              <Badge key={`${skill}-${skillIdx}`} variant="secondary" className="text-3xs px-2 py-0.5">
                                {skill}
                              </Badge>
                            ))}
                          </div>

                          {/* AI Match Reasoning */}
                          <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/50 text-xs text-muted-foreground leading-relaxed">
                            <Markdown content={recommendation.reasoning} />
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                          <Button asChild size="sm" variant="outline" className="text-xs h-8 flex-1">
                            <Link href={`/freelancers/${recommendation.freelancerId}`}>View profile</Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost" className="text-xs h-8 flex-1">
                            <Link href={getDirectMessageRoute('employer', recommendation.freelancerId)}>
                              <MessageSquare className="size-3.5 mr-1 text-primary" /> Message
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Submitted Proposals Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            Submitted Proposals
            <Badge variant="secondary" className="text-xs">
              {proposals.length}
            </Badge>
          </h2>
        </div>

        {proposals.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="size-12 rounded-2xl bg-secondary/50 flex items-center justify-center text-muted-foreground">
                <FileText className="size-6" />
              </div>
              <div>
                <p className="font-semibold text-base text-foreground">No proposals submitted yet</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                  Freelancers who submit proposals for this project will appear here for your review and contract creation.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => {
              const profile = profiles[proposal.freelancerId];
              const freelancerName = profile?.name || `Freelancer ${proposal.freelancerId.slice(0, 8)}`;
              const initials = freelancerName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'FL';

              // Check if there is an attached proposal brief document
              const proposalBriefDoc = proposal.attachments?.find((a) => a.filename.startsWith('Proposal_') || a.filename.endsWith('.md'));

              return (
                <Card key={proposal.id} className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="bg-secondary/15 border-b border-border/80 gap-4 sm:flex-row sm:items-start sm:justify-between pb-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm shadow-sm">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="truncate text-base font-bold text-foreground">
                            {freelancerName}
                          </CardTitle>
                          <Badge variant="secondary" className="bg-success-subtle text-success border border-success/20 text-3xs py-0.5">
                            <ShieldCheck className="size-3 mr-1" /> Verified Talent
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Submitted on {new Date(proposal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(proposal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={proposal.status} domain="proposal" />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5 pt-5">
                    {/* Proposal Metrics */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-secondary/20 p-3.5">
                        <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <DollarSign className="size-5" />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Proposed Rate</span>
                          <span className="font-bold text-base text-primary">{proposal.proposedRate.toLocaleString()} ETH</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-secondary/20 p-3.5">
                        <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Clock className="size-5" />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Delivery Timeline</span>
                          <span className="font-bold text-base text-foreground">{proposal.estimatedDuration} days</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-secondary/20 p-3.5">
                        <div className="size-9 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
                          <ShieldCheck className="size-5" />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Protection</span>
                          <span className="font-bold text-base text-foreground">Escrow Protected</span>
                        </div>
                      </div>
                    </div>

                    {/* Proposal Pitch / Cover Letter */}
                    {proposal.coverLetter ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Proposal Pitch & Approach</p>
                        <div className="p-4 rounded-xl border border-border bg-card text-xs max-h-64 overflow-y-auto">
                          <Markdown content={proposal.coverLetter} />
                        </div>
                      </div>
                    ) : proposalBriefDoc ? (
                      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                            <FileText className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-foreground truncate">Detailed Proposal Document Attached</p>
                            <p className="text-3xs text-muted-foreground">{proposalBriefDoc.filename} ({formatFileSize(proposalBriefDoc.size)})</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10 shrink-0"
                          onClick={() =>
                            setPreviewAttachment({
                              filename: proposalBriefDoc.filename,
                              url: proposalBriefDoc.url,
                              size: proposalBriefDoc.size,
                            })
                          }
                        >
                          <Eye className="size-3.5" /> Read Proposal Brief
                        </Button>
                      </div>
                    ) : null}

                    {/* Proposal Attachments */}
                    {proposal.attachments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          Attached Files ({proposal.attachments.length})
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {proposal.attachments.map((attachment) => {
                            const safeUrl = safeAttachmentUrl(attachment.url);
                            return (
                              <div
                                key={`${proposal.id}-${attachment.filename}`}
                                className="flex items-center justify-between p-3 rounded-xl border border-border bg-card gap-2 text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Paperclip className="size-4 text-primary shrink-0" />
                                  <div className="min-w-0">
                                    <p className="font-medium truncate text-foreground">{attachment.filename}</p>
                                    <p className="text-3xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {safeUrl ? (
                                    <>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs px-2 hover:text-primary hover:bg-primary/10"
                                        onClick={() =>
                                          setPreviewAttachment({
                                            filename: attachment.filename,
                                            url: attachment.url,
                                            size: attachment.size,
                                            content:
                                              attachment.filename.startsWith('Proposal_') && proposal.coverLetter
                                                ? proposal.coverLetter
                                                : undefined,
                                          })
                                        }
                                      >
                                        <Eye className="size-3 mr-1" /> View
                                      </Button>
                                      <Button
                                        asChild
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs px-2 hover:text-primary hover:bg-primary/10"
                                      >
                                        <a href={safeUrl} download={attachment.filename} target="_blank" rel="noopener noreferrer">
                                          <Download className="size-3" />
                                        </a>
                                      </Button>
                                    </>
                                  ) : (
                                    <span className="text-3xs text-muted-foreground">Unavailable</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 pt-4">
                      <Button asChild size="sm" variant="outline" className="rounded-full text-xs">
                        <Link href={getDirectMessageRoute('employer', proposal.freelancerId)}>
                          <MessageSquare className="mr-1.5 size-3.5 text-primary" /> Message Freelancer
                        </Link>
                      </Button>

                      {proposal.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-full text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                            onClick={() => setDecision({ proposal, action: 'reject' })}
                          >
                            <X className="mr-1.5 size-3.5" /> Reject
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-full gradient-primary shadow-md text-xs font-semibold"
                            onClick={() => setDecision({ proposal, action: 'accept' })}
                          >
                            <Check className="mr-1.5 size-3.5" /> Accept Proposal & Create Contract
                          </Button>
                        </div>
                      )}

                      {proposal.status === 'accepted' && (
                        <Badge className="bg-success-subtle text-success border border-success/30 font-semibold text-xs px-3 py-1 rounded-full">
                          <Check className="mr-1 size-3.5" /> Accepted Contract Created
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AttachmentPreviewDialog
        open={Boolean(previewAttachment)}
        onOpenChange={(open) => {
          if (!open) setPreviewAttachment(null);
        }}
        attachment={previewAttachment}
      />

      <Dialog
        open={decision !== null}
        onOpenChange={(open) => {
          if (!open && !updating) setDecision(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {decision?.action === 'accept' ? 'Accept this proposal?' : 'Reject this proposal?'}
            </DialogTitle>
            <DialogDescription>
              {decision?.action === 'accept'
                ? 'This will accept the proposal, create a secure on-chain escrow contract, and notify the freelancer.'
                : 'The freelancer will be notified that their proposal was not selected for this project.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)} disabled={updating}>
              Cancel
            </Button>
            <Button
              variant={decision?.action === 'accept' ? 'gradient' : 'destructive'}
              onClick={confirmDecision}
              loading={updating}
              loadingText="Processing…"
            >
              {decision?.action === 'accept'
                ? 'Accept & Create Contract'
                : 'Reject Proposal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
