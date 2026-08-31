'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BriefcaseBusiness, Clock, ExternalLink, FileText, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatFileSize, safeAttachmentUrl } from '@/lib/attachment-presentation';
import { proposalsApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { StatusBadge } from '@/components/ui/status-badge';
import { Markdown } from '@/components/ui/markdown';
import { AttachmentPreviewDialog, type AttachmentPreviewTarget } from '@/components/ui/attachment-preview-dialog';
import type { ProposalWithEmployerHistory } from '@/types';
import { DetailSkeleton } from '@/components/dashboard/skeletons';

export default function FreelancerProposalDetailPage() {
  const params = useParams<{ id: string }>();
  const proposalId = params?.id;
  const [details, setDetails] = useState<ProposalWithEmployerHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreviewTarget | null>(null);

  const load = useCallback(async () => {
    if (!proposalId) return;
    try {
      const { data } = await proposalsApi.getWithEmployerHistory(proposalId);
      setDetails(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to load this proposal.'));
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const withdraw = async () => {
    if (!proposalId) return;
    setWithdrawing(true);
    try {
      await proposalsApi.withdraw(proposalId);
      toast.success('Proposal withdrawn');
      void load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to withdraw proposal.'));
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return <DetailSkeleton label="Loading proposal" />;
  }

  if (!details) {
    return <div className="py-20 text-center"><p className="text-muted-foreground">Proposal not found or unavailable.</p><Button asChild variant="outline" className="mt-4"><Link href="/dashboard/freelancer/proposals">Back to proposals</Link></Button></div>;
  }

  const { proposal, project, employerHistory } = details;
  const employerName = employerHistory.companyName || project.employer?.name || 'Employer';

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2"><Link href="/dashboard/freelancer/proposals"><ArrowLeft className="mr-2 h-4 w-4" />Back to proposals</Link></Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><h1 className="text-2xl font-extrabold tracking-tight text-foreground">{project.title}</h1><p className="mt-1 text-muted-foreground">Your proposal to {employerName}</p></div>
          <StatusBadge status={proposal.status} domain="proposal" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card><CardHeader><CardTitle>Proposal</CardTitle></CardHeader><CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-secondary/30 p-3"><p className="text-xs text-muted-foreground">Proposed rate</p><p className="mt-1 font-semibold text-primary">{proposal.proposedRate.toLocaleString()} ETH</p></div>
              <div className="rounded-lg border border-border bg-secondary/30 p-3"><p className="text-xs text-muted-foreground">Estimated delivery</p><p className="mt-1 font-semibold">{proposal.estimatedDuration} days</p></div>
            </div>
            {proposal.coverLetter && (
              <div>
                <h2 className="mb-2 text-sm font-medium">Cover letter</h2>
                <div className="p-4 rounded-xl border border-border bg-card">
                  <Markdown content={proposal.coverLetter} />
                </div>
              </div>
            )}
            {proposal.attachments.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-medium">Attachments</h2>
                <ul className="space-y-2">
                  {proposal.attachments.map((attachment) => {
                    const url = safeAttachmentUrl(attachment.url);
                    return (
                      <li
                        key={`${attachment.filename}-${attachment.url}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-primary" />
                          <span className="truncate text-sm">{attachment.filename}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatFileSize(attachment.size)}
                          </span>
                        </span>
                        {url ? (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
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
                              View<ExternalLink className="ml-1 h-3 w-3" />
                            </Button>
                            <Button asChild size="sm" variant="ghost">
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                Open<ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unavailable</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-2 border-t border-border pt-4"><Button asChild variant="outline"><Link href={`/dashboard/freelancer/projects/${project.id}`}>View project</Link></Button>{proposal.status === 'pending' && <Button type="button" variant="ghost" className="text-destructive" disabled={withdrawing} onClick={() => void withdraw()}>{withdrawing ? 'Withdrawing…' : 'Withdraw proposal'}</Button>}</div>
          </CardContent></Card>
        </div>

        <div className="space-y-6">
          <Card><CardHeader><CardTitle className="text-base">Employer history</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="flex items-center gap-3"><BriefcaseBusiness className="h-5 w-5 text-primary" /><div><p className="font-medium">{employerName}</p>{employerHistory.industry && <p className="text-sm text-muted-foreground">{employerHistory.industry}</p>}</div></div>
            <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" />Completed projects</span><strong>{employerHistory.completedProjectsCount}</strong></div>
            <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-muted-foreground"><Star className="h-4 w-4" />Employer rating</span><strong>{employerHistory.reviewCount > 0 ? `${employerHistory.averageRating.toFixed(1)} (${employerHistory.reviewCount})` : 'Not yet rated'}</strong></div>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Submitted</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{new Date(proposal.createdAt).toLocaleString()}</CardContent></Card>
        </div>
      </div>

      <AttachmentPreviewDialog
        open={Boolean(previewAttachment)}
        onOpenChange={(open) => {
          if (!open) setPreviewAttachment(null);
        }}
        attachment={previewAttachment}
      />
    </div>
  );
}
