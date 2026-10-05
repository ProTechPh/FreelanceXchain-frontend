'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, HardDrive, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { fileManagementApi } from '@/lib/api';
import { formatFileSize } from '@/lib/file-storage';
import { getSecureFileUrl } from '@/lib/api/files';
import { safeAttachmentUrl } from '@/lib/attachment-presentation';
import { AttachmentPreviewDialog, type AttachmentPreviewTarget } from '@/components/ui/attachment-preview-dialog';
import { getApiErrorMessage } from '@/lib/auth-contract';
import type { FileInfo, FileQuota } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const STORAGE_PAGE_SIZE = 5;

export function StorageQuotaCard() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [quota, setQuota] = useState<FileQuota | null>(null);
  const [storageLoading, setStorageLoading] = useState(true);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FileInfo | null>(null);
  const [previewTarget, setPreviewTarget] = useState<AttachmentPreviewTarget | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(files.length / STORAGE_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * STORAGE_PAGE_SIZE;
  const paginatedFiles = files.slice(startIndex, startIndex + STORAGE_PAGE_SIZE);

  const loadStorage = async () => {
    setStorageLoading(true);
    try {
      const [fileResult, quotaResult] = await Promise.allSettled([
        fileManagementApi.list(),
        fileManagementApi.getQuota(),
      ]);

      if (quotaResult.status === 'fulfilled' && quotaResult.value?.data) {
        setQuota(quotaResult.value.data);
        setStorageAvailable(true);
      } else {
        setQuota({ used: 0, limit: 100 * 1024 * 1024, percentage: 0, files: 0 });
        setStorageAvailable(true);
      }

      if (fileResult.status === 'fulfilled' && Array.isArray(fileResult.value?.data)) {
        setFiles(fileResult.value.data);
      } else {
        setFiles([]);
      }
    } catch {
      setStorageAvailable(false);
    } finally {
      setStorageLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.allSettled([fileManagementApi.list(), fileManagementApi.getQuota()])
      .then(([fileResult, quotaResult]) => {
        if (!active) return;
        if (quotaResult.status === 'fulfilled' && quotaResult.value?.data) {
          setQuota(quotaResult.value.data);
          setStorageAvailable(true);
        } else {
          setQuota({ used: 0, limit: 100 * 1024 * 1024, percentage: 0, files: 0 });
          setStorageAvailable(true);
        }
        if (fileResult.status === 'fulfilled' && Array.isArray(fileResult.value?.data)) {
          setFiles(fileResult.value.data);
        } else {
          setFiles([]);
        }
      })
      .catch(() => {
        if (active) setStorageAvailable(false);
      })
      .finally(() => {
        if (active) setStorageLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    const file = fileToDelete;
    setDeletingFile(file.path);
    try {
      await fileManagementApi.remove(file.bucket, file.path);
      setStorageLoading(true);
      await loadStorage();
      toast.success('File deleted.');
      setFileToDelete(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to delete this file.'));
    } finally {
      setDeletingFile(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="size-5" /> File storage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {storageLoading && (
            <p role="status" className="text-sm text-muted-foreground">
              Loading storage usage…
            </p>
          )}
          {!storageLoading && !storageAvailable && (
            <p className="text-sm text-muted-foreground">Storage information is temporarily unavailable.</p>
          )}
          {!storageLoading && storageAvailable && quota && (
            <>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span>
                    {formatFileSize(quota.used)} of {formatFileSize(quota.limit)} used
                  </span>
                  <span className="text-muted-foreground">
                    {quota.files} file{quota.files === 1 ? '' : 's'}
                  </span>
                </div>
                <Progress
                  value={Math.round(quota.percentage)}
                  label="Storage used"
                  className="h-2"
                />
              </div>
              {files.length === 0 ? (
                <p className="text-sm text-muted-foreground">No proposal or portfolio files stored.</p>
              ) : (
                <div className="space-y-3">
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {paginatedFiles.map((file) => {
                      const secureUrl = file.bucket && file.path
                        ? getSecureFileUrl(file.bucket, file.path)
                        : (file.publicUrl ? safeAttachmentUrl(file.publicUrl) : null);
                      return (
                        <li key={`${file.bucket}:${file.path}`} className="flex items-center justify-between gap-3 p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)} · {file.bucket.replaceAll('_', ' ')}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {secureUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Open ${file.name}`}
                                onClick={() => {
                                  setPreviewTarget({
                                    filename: file.name,
                                    url: secureUrl,
                                    size: file.size,
                                  });
                                }}
                              >
                                <ExternalLink className="size-4" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${file.name}`}
                              disabled={deletingFile === file.path}
                              onClick={() => setFileToDelete(file)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {files.length > STORAGE_PAGE_SIZE && (
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={safeCurrentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Page {safeCurrentPage} of {totalPages} ({files.length} {files.length === 1 ? 'file' : 'files'})
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={safeCurrentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AttachmentPreviewDialog
        open={previewTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewTarget(null);
        }}
        attachment={previewTarget}
      />

      <Dialog
        open={fileToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deletingFile) setFileToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete File?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong className="text-foreground">&quot;{fileToDelete?.name}&quot;</strong> from your storage? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFileToDelete(null)}
              disabled={Boolean(deletingFile)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={Boolean(deletingFile)}
              loadingText="Deleting…"
              onClick={confirmDeleteFile}
            >
              Delete File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
