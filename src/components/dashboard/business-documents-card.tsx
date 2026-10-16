'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, FileText, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { employersApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { formatFileSize } from '@/lib/attachment-presentation';
import { formatDate } from '@/lib/format';
import { MAX_FILE_SIZE, getFileExtension } from '@/lib/file-validation';
import { BUSINESS_DOCUMENT_LABELS, getRequiredBusinessDocuments } from '@/lib/profile-form';
import type { BusinessDocument, BusinessDocumentType, BusinessType } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { AttachmentPreviewDialog, type AttachmentPreviewTarget } from '@/components/ui/attachment-preview-dialog';

const BUSINESS_DOCUMENT_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
const BUSINESS_DOCUMENT_ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp';

export const BUSINESS_DOCUMENTS_DISCLAIMER =
  'Documents are kept on file for transparency. FreelanceXchain does not check them against BIR, DTI or SEC records.';

function validateBusinessDocumentFile(file: File): string | null {
  if (!BUSINESS_DOCUMENT_EXTENSIONS.includes(getFileExtension(file.name))) {
    return 'Upload a PDF, PNG, JPG or WEBP file.';
  }
  if (file.size > MAX_FILE_SIZE) return 'Files must be 10 MB or smaller.';
  return null;
}

/** Slots shown for the business type: required ones first, then optional ones. */
function getDocumentSlots(businessType: BusinessType | '', documents: BusinessDocument[]) {
  const required = getRequiredBusinessDocuments(businessType);
  const optional: BusinessDocumentType[] = ['barangay_clearance'];
  // Keep showing a DTI/SEC upload that no longer matches the business type so it can be removed.
  for (const type of ['dti_certificate', 'sec_registration'] as const) {
    if (!required.includes(type) && documents.some((doc) => doc.documentType === type)) optional.push(type);
  }
  return { required, optional };
}

export function BusinessDocumentsCard({
  businessType,
  onDocumentsChange,
}: {
  businessType: BusinessType | '';
  onDocumentsChange?: () => void;
}) {
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [otherLabel, setOtherLabel] = useState('');
  const [preview, setPreview] = useState<AttachmentPreviewTarget | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const pendingType = useRef<BusinessDocumentType | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const { data } = await employersApi.listDocuments();
      setDocuments(data.documents);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to load your business documents.'));
    }
  }, []);

  useEffect(() => {
    let active = true;
    employersApi
      .listDocuments()
      .then(({ data }) => {
        if (active) setDocuments(data.documents);
      })
      .catch((err) => {
        if (active) toast.error(getApiErrorMessage(err, 'Unable to load your business documents.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const pickFile = (type: BusinessDocumentType) => {
    if (type === 'other' && otherLabel.trim().length < 2) {
      toast.error('Name the document before uploading it.');
      return;
    }
    pendingType.current = type;
    fileInput.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const type = pendingType.current;
    event.target.value = '';
    if (!file || !type) return;

    const validationError = validateBusinessDocumentFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setBusyKey(type);
    try {
      await employersApi.uploadDocument(file, type, type === 'other' ? otherLabel.trim() : undefined);
      if (type === 'other') setOtherLabel('');
      toast.success(`${type === 'other' ? 'Document' : BUSINESS_DOCUMENT_LABELS[type]} uploaded.`);
      await loadDocuments();
      onDocumentsChange?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to upload the document.'));
    } finally {
      setBusyKey(null);
      pendingType.current = null;
    }
  };

  const removeDocument = async (doc: BusinessDocument) => {
    setBusyKey(doc.id);
    try {
      await employersApi.deleteDocument(doc.id);
      toast.success('Document removed.');
      await loadDocuments();
      onDocumentsChange?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to remove the document.'));
    } finally {
      setBusyKey(null);
    }
  };

  const openPreview = (doc: BusinessDocument) => {
    if (!doc.fileUrl) return;
    setPreview({ filename: doc.fileName ?? 'Document', url: doc.fileUrl, size: doc.size, mimeType: doc.mimeType });
  };

  const { required, optional } = getDocumentSlots(businessType, documents);
  const otherDocuments = documents.filter((doc) => doc.documentType === 'other');

  const renderUploaded = (doc: BusinessDocument, replaceType?: BusinessDocumentType) => (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate">{doc.fileName}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatFileSize(doc.size)} · {formatDate(doc.createdAt)}
        </span>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => openPreview(doc)}>
          <Eye className="size-3.5" aria-hidden="true" />
          View
        </Button>
        {replaceType && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => pickFile(replaceType)}
            loading={busyKey === replaceType}
            disabled={busyKey !== null}
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Replace
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void removeDocument(doc)}
          loading={busyKey === doc.id}
          disabled={busyKey !== null}
          aria-label={`Remove ${doc.label ?? BUSINESS_DOCUMENT_LABELS[doc.documentType]}`}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          Remove
        </Button>
      </div>
    </div>
  );

  const renderSlot = (type: BusinessDocumentType, isRequired: boolean) => {
    const doc = documents.find((item) => item.documentType === type);
    return (
      <li key={type} className="space-y-2 rounded-xl border border-border p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{BUSINESS_DOCUMENT_LABELS[type]}</p>
          <Badge variant={isRequired ? 'default' : 'outline'}>{isRequired ? 'Required' : 'Optional'}</Badge>
          {doc && <Badge variant="secondary">On file</Badge>}
        </div>
        {doc ? (
          renderUploaded(doc, type)
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => pickFile(type)}
            loading={busyKey === type}
            disabled={busyKey !== null}
          >
            <Upload className="size-3.5" aria-hidden="true" />
            Upload
          </Button>
        )}
      </li>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload a PDF or image (PNG, JPG, WEBP) up to 10 MB for each document. Signed-in freelancers can view the documents
          from your public profile.
        </p>

        <input
          ref={fileInput}
          type="file"
          className="hidden"
          accept={BUSINESS_DOCUMENT_ACCEPT}
          onChange={(event) => void handleFileSelected(event)}
          aria-hidden="true"
          tabIndex={-1}
        />

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading documents…</p>
        ) : (
          <>
            <ul className="space-y-3">
              {required.map((type) => renderSlot(type, true))}
              {optional.map((type) => renderSlot(type, false))}
            </ul>

            <div className="space-y-3 rounded-xl border border-dashed border-border p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">Other documents</p>
                <Badge variant="outline">Optional</Badge>
              </div>
              {otherDocuments.length > 0 && (
                <ul className="space-y-3">
                  {otherDocuments.map((doc) => (
                    <li key={doc.id} className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{doc.label ?? 'Other document'}</p>
                      {renderUploaded(doc)}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <Field label="Document name" htmlFor="other-document-label" className="flex-1">
                  <Input
                    id="other-document-label"
                    placeholder="e.g. BOI Certificate of Registration"
                    maxLength={255}
                    value={otherLabel}
                    onChange={(event) => setOtherLabel(event.target.value)}
                  />
                </Field>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start sm:mb-0.5 sm:self-auto"
                  onClick={() => pickFile('other')}
                  loading={busyKey === 'other'}
                  disabled={busyKey !== null}
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add document
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <AttachmentPreviewDialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
        attachment={preview}
      />
    </Card>
  );
}
