'use client';

import Link from 'next/link';
import { ExternalLink, FileText, Send } from 'lucide-react';
import type { Proposal } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Markdown } from '@/components/ui/markdown';
import { formatAmount } from '@/lib/format';
import { formatFileSize, safeAttachmentUrl } from '@/lib/attachment-presentation';
import type { AttachmentPreviewTarget } from '@/components/ui/attachment-preview-dialog';
import { formatPostedDate } from './project-meta-helpers';

interface ProjectSubmittedProposalProps {
  proposal: Proposal;
  withdrawing: boolean;
  onRequestWithdraw: () => void;
  onPreviewAttachment: (target: AttachmentPreviewTarget) => void;
}

export function ProjectSubmittedProposal({
  proposal,
  withdrawing,
  onRequestWithdraw,
  onPreviewAttachment,
}: ProjectSubmittedProposalProps) {
  return (
    <Card className="rounded-2xl border-2 border-primary/40 bg-primary/5 shadow-sm overflow-hidden">
      <CardHeader className="bg-primary/10 border-b border-primary/20 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <Send className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">Your Submitted Proposal</CardTitle>
              <p className="text-xs text-muted-foreground">Submitted on {formatPostedDate(proposal.createdAt)}</p>
            </div>
          </div>
          <div>
            <Badge
              variant="outline"
              className={
                proposal.status === 'accepted'
                  ? 'bg-success/20 text-success border-success/40 font-semibold'
                  : proposal.status === 'rejected'
                    ? 'bg-destructive/20 text-destructive border-destructive/40 font-semibold'
                    : 'bg-warning/20 text-warning border-warning/40 font-semibold'
              }
            >
              {proposal.status === 'pending' ? 'Pending Employer Review' : proposal.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Key Proposal Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-card border border-border text-xs">
          <div>
            <span className="text-muted-foreground block">Proposed Rate</span>
            <span className="text-sm font-bold text-primary">{formatAmount(proposal.proposedRate)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Estimated Delivery</span>
            <span className="text-sm font-bold text-foreground">{proposal.estimatedDuration} days</span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-muted-foreground block">Attachments</span>
            <span className="text-sm font-bold text-foreground">{proposal.attachments?.length || 0} file(s)</span>
          </div>
        </div>

        {/* Cover Letter / Proposal Pitch */}
        {proposal.coverLetter && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Your Proposal Pitch</p>
            <div className="p-3.5 rounded-xl border border-border bg-card text-xs max-h-64 overflow-y-auto">
              <Markdown content={proposal.coverLetter} />
            </div>
          </div>
        )}

        {/* Attached Documents */}
        {proposal.attachments && proposal.attachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Attached Documents</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {proposal.attachments.map((att, idx) => {
                const safeUrl = safeAttachmentUrl(att.url);
                return (
                  <div
                    key={att.url || idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="size-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate text-foreground">{att.filename}</p>
                        <p className="text-3xs text-muted-foreground">{formatFileSize(att.size || 0)}</p>
                      </div>
                    </div>
                    {safeUrl ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 min-h-[44px] sm:min-h-0 sm:h-7 text-xs px-2 shrink-0 hover:text-primary hover:bg-primary/10"
                        onClick={() =>
                          onPreviewAttachment({
                            filename: att.filename,
                            url: att.url,
                            size: att.size,
                            content:
                              att.filename.startsWith('Proposal_') && proposal.coverLetter
                                ? proposal.coverLetter
                                : undefined,
                          })
                        }
                      >
                        View <ExternalLink className="size-3 ml-1" />
                      </Button>
                    ) : (
                      <span className="text-3xs text-muted-foreground">Unavailable</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <Button asChild size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-foreground">
            <Link href="/dashboard/freelancer/proposals">
              Track in My Proposals →
            </Link>
          </Button>

          {proposal.status === 'pending' && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={onRequestWithdraw}
              disabled={withdrawing}
            >
              {withdrawing ? 'Withdrawing...' : 'Withdraw Proposal'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
