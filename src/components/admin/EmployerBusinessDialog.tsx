'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, FileText, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { formatFileSize } from '@/lib/attachment-presentation';
import { formatDate } from '@/lib/format';
import { BUSINESS_DOCUMENT_LABELS, getBusinessTypeLabel, getRegistrationNumberLabel } from '@/lib/profile-form';
import type { BusinessDocument, BusinessProfileCompleteness, EmployerProfile } from '@/types';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AttachmentPreviewDialog, type AttachmentPreviewTarget } from '@/components/ui/attachment-preview-dialog';
import { BUSINESS_DOCUMENTS_DISCLAIMER } from '@/components/dashboard/business-documents-card';

type BusinessProfileResponse = {
  profile: EmployerProfile;
  documents: BusinessDocument[];
  completeness: BusinessProfileCompleteness | null;
};

/** View and verify an employer's business information and documents. */
export function EmployerBusinessDialog({
  open,
  onOpenChange,
  user,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The employer to show; the Users page and the Business documents page both pass one. */
  user: { id: string; name?: string | null; email?: string | null } | null;
  onUpdated?: () => void;
}) {
  // Keyed by user id so a result is never shown for a different employer.
  const [result, setResult] = useState<{ userId: string; data?: BusinessProfileResponse; error?: string } | null>(null);
  const [preview, setPreview] = useState<AttachmentPreviewTarget | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const userId = open ? user?.id : undefined;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    adminApi
      .getEmployerBusinessProfile(userId)
      .then(({ data: response }) => {
        if (active) setResult({ userId, data: response });
      })
      .catch((err) => {
        if (active) setResult({ userId, error: getApiErrorMessage(err, "Unable to load this employer's business profile.") });
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const current = userId && result?.userId === userId ? result : null;
  const loading = Boolean(userId) && current === null;
  const data = current?.data ?? null;
  const error = current?.error ?? null;

  const profile = data?.profile;
  const details = profile
    ? [
        { label: 'Company name', value: profile.companyName },
        { label: 'Industry', value: profile.industry },
        { label: 'Business type', value: getBusinessTypeLabel(profile.businessType) },
        { label: 'TIN', value: profile.tin },
        { label: getRegistrationNumberLabel(profile.businessType), value: profile.registrationNumber },
        { label: 'Year established', value: profile.yearEstablished ? String(profile.yearEstablished) : null },
        { label: 'Business address', value: profile.businessAddress },
        { label: 'Business phone', value: profile.businessPhone },
        { label: 'Business email', value: profile.businessEmail },
        { label: 'Website', value: profile.website },
      ]
    : [];

  const handleVerify = async () => {
    if (!userId) return;
    setActionBusy(true);
    try {
      const { data: resp } = await adminApi.verifyEmployerBusinessProfile(userId);
      toast.success('Business profile verified and confirmed successfully.');
      setResult((prev) => (prev ? { ...prev, data: { ...prev.data!, profile: resp.profile } } : prev));
      onUpdated?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to verify business profile.'));
    } finally {
      setActionBusy(false);
    }
  };

  const handleReject = async () => {
    if (!userId) return;
    if (rejectNotes.trim().length < 5) {
      toast.error('Please enter notes explaining what needs to be corrected (min 5 characters).');
      return;
    }
    setActionBusy(true);
    try {
      const { data: resp } = await adminApi.rejectEmployerBusinessProfile(userId, { notes: rejectNotes.trim() });
      toast.success('Business profile marked as not verified and returned to user with notes.');
      setResult((prev) => (prev ? { ...prev, data: { ...prev.data!, profile: resp.profile } } : prev));
      setIsRejecting(false);
      setRejectNotes('');
      onUpdated?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to return business profile.'));
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-full max-w-[calc(100%-1.5rem)] sm:max-w-2xl md:max-w-3xl flex-col gap-0 p-0 overflow-hidden bg-card border-border shadow-2xl">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 sm:px-6 pr-12">
          <div className="flex flex-wrap items-center gap-2.5">
            <DialogTitle className="text-lg font-bold text-foreground">Business profile</DialogTitle>
            {profile?.verificationStatus === 'verified' && (
              <Badge className="bg-success-subtle text-success border border-success/30 font-medium">Verified</Badge>
            )}
            {profile?.verificationStatus === 'rejected' && (
              <Badge className="bg-destructive-subtle text-destructive border border-destructive/30 font-medium">Not Verified</Badge>
            )}
            {profile?.verificationStatus === 'pending' && (
              <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-500 font-medium">Pending Review</Badge>
            )}
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {user ? `${user.name || 'User'} (${user.email || 'No email'})` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-6 space-y-5">
          {loading && <p className="text-sm text-muted-foreground">Loading business profile…</p>}
          {error && <Alert title="Couldn't load the business profile" description={error} />}

          {data && (
            <div className="space-y-5">
              {profile?.verificationStatus === 'verified' ? (
                <Alert
                  tone="success"
                  live={false}
                  title="Business profile verified"
                  description={`Confirmed and verified by admin on ${formatDate(profile.verifiedAt || profile.updatedAt)}.${
                    profile.verificationNotes ? ` Note: "${profile.verificationNotes}"` : ''
                  }`}
                />
              ) : profile?.verificationStatus === 'rejected' ? (
                <Alert
                  tone="destructive"
                  title="Returned as not verified"
                  description={`Admin feedback notes given to employer: "${profile.verificationNotes || 'No notes specified'}"`}
                />
              ) : profile?.verificationStatus === 'pending' ? (
                <Alert
                  tone="info"
                  title="Pending admin verification"
                  description="The employer has completed their business information and uploaded documents. Review the details below and confirm verification or return as not verified with notes."
                />
              ) : (
                <Alert tone="info" live={false} title="Kept on file for transparency" description={BUSINESS_DOCUMENTS_DISCLAIMER} />
              )}

              {data.completeness && !data.completeness.complete && (
                <Alert
                  tone="warning"
                  title="Incomplete Business Profile"
                  description={`Missing fields: ${data.completeness.missingFields.length > 0 ? data.completeness.missingFields.join(', ') : 'None'}. Missing documents: ${data.completeness.missingDocuments.length > 0 ? data.completeness.missingDocuments.join(', ') : 'None'}.`}
                />
              )}

              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Business information</h3>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border border-border bg-muted/40 p-4 text-sm sm:grid-cols-2">
                  {details.map((item) => (
                    <div key={item.label} className="min-w-0">
                      <dt className="text-xs text-muted-foreground">{item.label}</dt>
                      <dd className="break-all sm:break-words font-medium text-foreground">{item.value || '—'}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Documents ({data.documents.length})
                </h3>
                {data.documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents uploaded.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <span className="text-sm font-medium text-foreground">
                              {doc.label ?? BUSINESS_DOCUMENT_LABELS[doc.documentType]}
                            </span>
                            {doc.documentType === 'other' && <Badge variant="outline">Other</Badge>}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {doc.fileName} · {formatFileSize(doc.size)} · uploaded {formatDate(doc.createdAt)}
                          </p>
                        </div>
                        {doc.fileUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0 self-start sm:self-auto"
                            onClick={() =>
                              setPreview({ filename: doc.fileName ?? 'Document', url: doc.fileUrl!, size: doc.size, mimeType: doc.mimeType })
                            }
                          >
                            <Eye className="size-3.5 mr-1" aria-hidden="true" />
                            View
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Admin Verification Controls */}
              <section className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Verification Review</h3>

                {isRejecting ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Specify what the employer needs to correct / re-submit:</p>
                    <Textarea
                      placeholder="Enter reason or instructions (e.g. Expired Mayor's permit, TIN mismatch, blurry copy, re-upload needed)..."
                      rows={3}
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                    />
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIsRejecting(false)} disabled={actionBusy}>
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        loading={actionBusy}
                        disabled={rejectNotes.trim().length < 5}
                        onClick={handleReject}
                      >
                        Confirm &amp; Return as Not Verified
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      {profile?.verificationStatus === 'verified'
                        ? 'This business profile is verified.'
                        : 'Confirm that all documents are valid to verify, or return as not verified with feedback notes.'}
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setIsRejecting(true)}
                        disabled={actionBusy}
                      >
                        <XCircle className="size-4 mr-1" aria-hidden="true" />
                        Return as Not Verified
                      </Button>
                      {profile?.verificationStatus !== 'verified' && (
                        <Button
                          type="button"
                          size="sm"
                          variant="gradient"
                          loading={actionBusy}
                          onClick={handleVerify}
                          disabled={!data?.completeness?.complete}
                        >
                          <CheckCircle2 className="size-4 mr-1" aria-hidden="true" />
                          Verify &amp; Confirm
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        <AttachmentPreviewDialog
          open={preview !== null}
          onOpenChange={(isOpen) => {
            if (!isOpen) setPreview(null);
          }}
          attachment={preview}
        />
      </DialogContent>
    </Dialog>
  );
}
