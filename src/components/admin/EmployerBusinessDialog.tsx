'use client';

import { useEffect, useState } from 'react';
import { Eye, FileText } from 'lucide-react';
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
import { AttachmentPreviewDialog, type AttachmentPreviewTarget } from '@/components/ui/attachment-preview-dialog';
import { BusinessProfileCompletenessAlert } from '@/components/dashboard/employer-profile-fields';
import { BUSINESS_DOCUMENTS_DISCLAIMER } from '@/components/dashboard/business-documents-card';

type BusinessProfileResponse = {
  profile: EmployerProfile;
  documents: BusinessDocument[];
  completeness: BusinessProfileCompleteness | null;
};

/** Read-only view of an employer's business information and documents. */
export function EmployerBusinessDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The employer to show; the Users page and the Business documents page both pass one. */
  user: { id: string; name?: string | null; email?: string | null } | null;
}) {
  // Keyed by user id so a result is never shown for a different employer.
  const [result, setResult] = useState<{ userId: string; data?: BusinessProfileResponse; error?: string } | null>(null);
  const [preview, setPreview] = useState<AttachmentPreviewTarget | null>(null);
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
        if (active) setResult({ userId, error: getApiErrorMessage(err, 'Unable to load this employer\'s business profile.') });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Business profile</DialogTitle>
          <DialogDescription>
            {user ? `${user.name || user.email} · read-only` : 'Read-only'}
          </DialogDescription>
        </DialogHeader>

        {loading && <p className="text-sm text-muted-foreground">Loading business profile…</p>}
        {error && <Alert title="Couldn't load the business profile" description={error} />}

        {data && (
          <div className="space-y-5">
            <Alert tone="info" live={false} title="Kept on file, not verified" description={BUSINESS_DOCUMENTS_DISCLAIMER} />
            {data.completeness && <BusinessProfileCompletenessAlert completeness={data.completeness} />}

            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Business information</h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm sm:grid-cols-2">
                {details.map((item) => (
                  <div key={item.label} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{item.label}</dt>
                    <dd className="break-words font-medium text-foreground">{item.value || '—'}</dd>
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
                      <div className="min-w-0">
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
                          className="shrink-0"
                          onClick={() =>
                            setPreview({ filename: doc.fileName ?? 'Document', url: doc.fileUrl!, size: doc.size, mimeType: doc.mimeType })
                          }
                        >
                          <Eye className="size-3.5" aria-hidden="true" />
                          View
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

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
