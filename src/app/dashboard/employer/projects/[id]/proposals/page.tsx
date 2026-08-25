'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Check, Clock, DollarSign, FileText, Loader2, MessageSquare, Paperclip, SearchX, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { FreelancerProfile, Project, Proposal } from '@/types';

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
  const [decision, setDecision] = useState<PendingDecision | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;

    try {
      const [projectResponse, proposalResponse, recommendationResponse] = await Promise.all([
        projectsApi.get(projectId),
        projectsApi.getProposals(projectId),
        matchingApi.getFreelancerRecommendations(projectId, 5).catch(() => ({ data: [] as FreelancerRecommendation[] })),
      ]);
      const loadedProposals = proposalResponse.data.items;
      const loadedRecommendations = recommendationResponse.data;
      const freelancerIds = [...new Set([
        ...loadedProposals.map((proposal) => proposal.freelancerId),
        ...loadedRecommendations.map((recommendation) => recommendation.freelancerId),
      ])];
      const profileEntries = await Promise.all(
        freelancerIds.map(async (freelancerId) => {
          try {
            const response = await freelancersApi.getPublicProfile(freelancerId);
            return [freelancerId, response.data] as const;
          } catch {
            return [freelancerId, null] as const;
          }
        }),
      );

      setProject(projectResponse.data);
      setProposals(loadedProposals);
      setRecommendations(loadedRecommendations);
      setProfiles(Object.fromEntries(profileEntries));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load project proposals'));
    } finally {
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
      <div className="flex h-64 items-center justify-center" aria-label="Loading proposals">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
            <Link href={`/projects/${project.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to project
            </Link>
          </Button>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Project proposals</h1>
          <p className="mt-1 text-muted-foreground">Review offers for {project.title}</p>
        </div>
        <div className="flex gap-3">
          <Badge variant="secondary" className="h-8 px-3">
            {proposals.length} total
          </Badge>
          <Badge className="h-8 bg-warning-subtle px-3 text-warning">
            {pendingCount} pending
          </Badge>
        </div>
      </div>

      {recommendations.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader><CardTitle className="text-lg">Recommended talent</CardTitle><p className="text-sm text-muted-foreground">AI-ranked freelancers whose skills and reputation fit this project.</p></CardHeader>
          <CardContent><div className="grid gap-3 lg:grid-cols-2">{recommendations.map((recommendation) => {
            const profile = profiles[recommendation.freelancerId];
            const name = profile?.name || `Freelancer ${recommendation.freelancerId.slice(0, 8)}`;
            return <div key={recommendation.freelancerId} className="rounded-xl border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{name}</p><p className="mt-1 text-xs text-muted-foreground">Reputation {Math.round(recommendation.reputationScore)}%</p></div><Badge className="bg-success-subtle text-success">{Math.round(recommendation.combinedScore)}% fit</Badge></div><div className="mt-3 flex flex-wrap gap-1.5">{recommendation.matchedSkills.map((skill) => <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>)}</div><p className="mt-3 text-sm text-muted-foreground">{recommendation.reasoning}</p><div className="mt-4 flex gap-2"><Button asChild size="sm" variant="outline"><Link href={`/freelancers/${recommendation.freelancerId}`}>View profile</Link></Button><Button asChild size="sm" variant="ghost"><Link href={getDirectMessageRoute('employer', recommendation.freelancerId)}>Message</Link></Button></div></div>;
          })}</div></CardContent>
        </Card>
      )}

      {proposals.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">No proposals yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                New freelancer proposals will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const profile = profiles[proposal.freelancerId];
            const freelancerName = profile?.name || `Freelancer ${proposal.freelancerId.slice(0, 8)}`;

            return (
              <Card key={proposal.id} className="border-border bg-card">
                <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">{freelancerName}</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Submitted {new Date(proposal.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={proposal.status} domain="proposal" />
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Proposed rate</span>
                      <span className="ml-auto font-semibold">${proposal.proposedRate.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Delivery</span>
                      <span className="ml-auto font-semibold">{proposal.estimatedDuration} days</span>
                    </div>
                  </div>

                  {proposal.coverLetter && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Cover letter</p>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {proposal.coverLetter}
                      </p>
                    </div>
                  )}

                  {proposal.attachments.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Attachments</p>
                      <div className="flex flex-wrap gap-2">
                        {proposal.attachments.map((attachment) => {
                          const safeUrl = safeAttachmentUrl(attachment.url);
                          const content = (
                            <>
                              <Paperclip className="h-3.5 w-3.5" />
                              <span className="max-w-52 truncate">{attachment.filename}</span>
                              <span className="text-muted-foreground">({formatFileSize(attachment.size)})</span>
                            </>
                          );

                          return safeUrl ? (
                            <a
                              key={`${proposal.id}-${attachment.filename}`}
                              href={safeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs hover:border-primary/40 hover:bg-primary/[0.04]"
                            >
                              {content}
                            </a>
                          ) : (
                            <span
                              key={`${proposal.id}-${attachment.filename}`}
                              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground"
                            >
                              {content}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {proposal.status === 'pending' && (
                    <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setDecision({ proposal, action: 'reject' })}
                      >
                        <X className="mr-2 h-4 w-4" /> Reject
                      </Button>
                      <Button
                        variant="gradient"
                        onClick={() => setDecision({ proposal, action: 'accept' })}
                      >
                        <Check className="mr-2 h-4 w-4" /> Accept Proposal
                      </Button>
                    </div>
                  )}
                  {proposal.status === 'accepted' && (
                    <div className="flex justify-end border-t border-border pt-4">
                      <Button asChild variant="gradient">
                        <Link href={getDirectMessageRoute('employer', proposal.freelancerId)}>
                          <MessageSquare className="mr-2 h-4 w-4" /> Message Freelancer
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={decision !== null}
        onOpenChange={(open) => {
          if (!open && !updating) setDecision(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision?.action === 'accept' ? 'Accept this proposal?' : 'Reject this proposal?'}
            </DialogTitle>
            <DialogDescription>
              {decision?.action === 'accept'
                ? 'This creates a contract and rejects the other pending proposals for this project.'
                : 'The freelancer will no longer be considered for this project.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)} disabled={updating}>
              Cancel
            </Button>
            <Button
              variant={decision?.action === 'accept' ? 'gradient' : 'destructive'}
              onClick={confirmDecision}
              disabled={updating}
            >
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {updating
                ? 'Updating…'
                : decision?.action === 'accept'
                  ? 'Accept Proposal'
                  : 'Reject Proposal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
