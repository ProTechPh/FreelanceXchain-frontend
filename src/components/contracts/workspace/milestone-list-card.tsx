'use client';

import { Eye, Paperclip } from 'lucide-react';
import type { Contract, KycStatus, Milestone, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { getMilestonePermissions } from '@/lib/contract-workflow';
import { formatAmount, formatDate } from '@/lib/format';
import { formatFileSize, safeAttachmentUrl } from '@/lib/attachment-presentation';
import type { AttachmentPreviewTarget } from '@/components/ui/attachment-preview-dialog';

type ParticipantRole = Extract<UserRole, 'employer' | 'freelancer'>;

interface MilestoneListCardProps {
  milestones: Milestone[];
  role: ParticipantRole;
  kycStatus?: KycStatus;
  contractStatus: Contract['status'];
  actionId: string | null;
  notes: Record<string, string>;
  rejectionReasons: Record<string, string>;
  onFilesChange: (milestoneId: string, files: File[]) => void;
  onNotesChange: (milestoneId: string, note: string) => void;
  onRejectionReasonChange: (milestoneId: string, reason: string) => void;
  onSubmitMilestone: (milestone: Milestone) => void;
  onApproveMilestone: (milestone: Milestone) => void;
  onRejectMilestone: (milestoneId: string) => void;
  onPreviewAttachment: (target: AttachmentPreviewTarget) => void;
}

export function MilestoneListCard({
  milestones,
  role,
  kycStatus,
  contractStatus,
  actionId,
  notes,
  rejectionReasons,
  onFilesChange,
  onNotesChange,
  onRejectionReasonChange,
  onSubmitMilestone,
  onApproveMilestone,
  onRejectMilestone,
  onPreviewAttachment,
}: MilestoneListCardProps) {
  return (
    <section className="space-y-3" aria-labelledby="milestones-title">
      <h2 id="milestones-title" className="text-xl font-semibold">Milestones</h2>
      {milestones.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">No milestones found.</CardContent>
        </Card>
      )}
      {milestones.map((milestone) => {
        const permissions = getMilestonePermissions(milestone.status, role, kycStatus, contractStatus);
        return (
          <Card key={milestone.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{milestone.title}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{milestone.description}</p>
                </div>
                <StatusBadge status={milestone.status} domain="milestone" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <span>
                  <span className="text-muted-foreground">Amount:</span> {formatAmount(milestone.amount)}
                </span>
                <span>
                  <span className="text-muted-foreground">Due:</span>{' '}
                  {milestone.dueDate ? formatDate(milestone.dueDate) : 'Not set'}
                </span>
              </div>
              {milestone.rejectionReason && (
                <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  Revision requested: {milestone.rejectionReason}
                </p>
              )}
              {(milestone.deliverableFiles ?? []).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Deliverable Files ({(milestone.deliverableFiles ?? []).length})
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(milestone.deliverableFiles ?? []).map((file) => {
                      const url = safeAttachmentUrl(file.url);
                      return (
                        <div
                          key={`${file.filename}-${file.url}`}
                          className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/50 gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Paperclip className="size-4 text-primary shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate text-foreground">{file.filename}</p>
                              {file.size ? (
                                <p className="text-3xs text-muted-foreground">{formatFileSize(file.size)}</p>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {url ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs px-2 hover:text-primary hover:bg-primary/10"
                                onClick={() =>
                                  onPreviewAttachment({
                                    filename: file.filename,
                                    url: file.url,
                                    size: file.size,
                                    mimeType: file.mimeType,
                                  })
                                }
                              >
                                <Eye className="size-3 mr-1" /> View
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Unavailable</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {permissions.canSubmit && (
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <div className="space-y-2">
                    <Label htmlFor={`files-${milestone.id}`}>Deliverable files</Label>
                    <Input
                      id={`files-${milestone.id}`}
                      type="file"
                      multiple
                      aria-describedby={`files-hint-${milestone.id}`}
                      onChange={(event) =>
                        onFilesChange(milestone.id, Array.from(event.target.files ?? []))
                      }
                    />
                    <p id={`files-hint-${milestone.id}`} className="text-xs text-muted-foreground">
                      Upload the files that demonstrate this milestone is complete.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`notes-${milestone.id}`}>Submission notes</Label>
                    <textarea
                      id={`notes-${milestone.id}`}
                      aria-describedby={`notes-hint-${milestone.id}`}
                      className="min-h-24 w-full rounded-lg border border-input bg-transparent p-3 text-sm"
                      value={notes[milestone.id] ?? ''}
                      onChange={(event) => onNotesChange(milestone.id, event.target.value)}
                    />
                    <p id={`notes-hint-${milestone.id}`} className="text-xs text-muted-foreground">
                      Describe what you delivered and any relevant context for the employer.
                    </p>
                  </div>
                  <Button
                    disabled={actionId === milestone.id}
                    onClick={() => onSubmitMilestone(milestone)}
                    aria-label={`Submit milestone: ${milestone.title}`}
                  >
                    Submit milestone
                  </Button>
                </div>
              )}

              {permissions.canApprove && (
                <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-end">
                  <Button
                    className="bg-success text-success-foreground hover:bg-success/90"
                    disabled={actionId === milestone.id}
                    onClick={() => onApproveMilestone(milestone)}
                    aria-label={`Approve milestone: ${milestone.title}`}
                  >
                    Release Payment
                  </Button>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`reject-${milestone.id}`}>Revision reason</Label>
                    <Input
                      id={`reject-${milestone.id}`}
                      aria-describedby={`reject-hint-${milestone.id}`}
                      value={rejectionReasons[milestone.id] ?? ''}
                      onChange={(event) => onRejectionReasonChange(milestone.id, event.target.value)}
                    />
                    <p id={`reject-hint-${milestone.id}`} className="text-xs text-muted-foreground">
                      Explain what needs to be changed before you can approve.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    disabled={actionId === milestone.id || !(rejectionReasons[milestone.id] ?? '').trim()}
                    onClick={() => onRejectMilestone(milestone.id)}
                    aria-label={`Request revision for milestone: ${milestone.title}`}
                  >
                    Request revision
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
