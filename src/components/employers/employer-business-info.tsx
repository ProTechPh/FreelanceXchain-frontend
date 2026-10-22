'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, FileText } from 'lucide-react';
import { employersApi } from '@/lib/api';
import { BUSINESS_DOCUMENT_LABELS, getBusinessTypeLabel, getRegistrationNumberLabel } from '@/lib/profile-form';
import type { BusinessDocument, EmployerProfile } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AttachmentPreviewDialog, type AttachmentPreviewTarget } from '@/components/ui/attachment-preview-dialog';
import { BUSINESS_DOCUMENTS_DISCLAIMER } from '@/components/dashboard/business-documents-card';

function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Business information and documents an employer keeps on file. Registration
 * and contact fields and document files are only returned by the API for
 * signed-in users, so they are simply absent for visitors.
 */
export function EmployerBusinessInfo({
  employerId,
  profile,
  compact = false,
}: {
  employerId: string | undefined;
  profile: Partial<EmployerProfile> | null;
  compact?: boolean;
}) {
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [preview, setPreview] = useState<AttachmentPreviewTarget | null>(null);

  useEffect(() => {
    if (!employerId) return;
    let active = true;
    employersApi
      .getPublicDocuments(employerId)
      .then(({ data }) => {
        if (active) setDocuments(data.documents);
      })
      .catch(() => {
        if (active) setDocuments([]);
      });
    return () => {
      active = false;
    };
  }, [employerId]);

  const website = safeExternalUrl(profile?.website);
  const details = [
    { label: 'Business type', value: getBusinessTypeLabel(profile?.businessType) },
    { label: 'Year established', value: profile?.yearEstablished ? String(profile.yearEstablished) : null },
    { label: 'TIN', value: profile?.tin },
    { label: getRegistrationNumberLabel(profile?.businessType), value: profile?.registrationNumber },
    { label: 'Business address', value: profile?.businessAddress },
    { label: 'Business phone', value: profile?.businessPhone },
    { label: 'Business email', value: profile?.businessEmail },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));

  if (details.length === 0 && !website && documents.length === 0) return null;

  const headingClass = compact
    ? 'text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2'
    : 'text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3';

  return (
    <div className="space-y-4">
      {(details.length > 0 || website) && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h3 className={headingClass.replace(/mb-\d/, 'mb-0')}>Business information</h3>
            {profile?.verificationStatus === 'verified' && (
              <Badge className="bg-success-subtle text-success gap-1">
                <CheckCircle2 className="size-3.5" />
                Verified Business
              </Badge>
            )}
          </div>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-2xl border border-border/50 bg-muted/40 p-4 text-sm sm:grid-cols-2">
            {details.map((item) => (
              <div key={item.label} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{item.label}</dt>
                <dd className="break-words font-medium text-foreground">{item.value}</dd>
              </div>
            ))}
            {website && (
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Website</dt>
                <dd className="break-words font-medium">
                  <a href={website} target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline">
                    {website}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {documents.length > 0 && (
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className={headingClass.replace(/mb-\d/, 'mb-0')}>Business documents on file</h3>
            <Badge variant="secondary">{documents.length} on file</Badge>
          </div>
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-col gap-2 rounded-xl border border-border/60 bg-secondary/30 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                  <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate">{doc.label ?? BUSINESS_DOCUMENT_LABELS[doc.documentType]}</span>
                </span>
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
          <p className="mt-2 text-xs text-muted-foreground">
            {BUSINESS_DOCUMENTS_DISCLAIMER}
            {!documents.some((doc) => doc.fileUrl) && ' Sign in to view the documents.'}
          </p>
        </div>
      )}

      <AttachmentPreviewDialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
        attachment={preview}
      />
    </div>
  );
}
