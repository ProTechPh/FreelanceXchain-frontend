'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Markdown } from '@/components/ui/markdown';
import { formatFileSize, safeAttachmentUrl } from '@/lib/attachment-presentation';
import { sanitizeMarkdownText } from '@/components/projects/ProposalDialog';
import {
  Image as ImageIcon,
  FileCode,
  Download,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  File,
} from 'lucide-react';
import { toast } from 'sonner';

export interface AttachmentPreviewTarget {
  filename: string;
  url: string;
  size?: number;
  mimeType?: string;
  content?: string;
}

interface AttachmentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachment: AttachmentPreviewTarget | null;
}

export function AttachmentPreviewDialog({
  open,
  onOpenChange,
  attachment,
}: AttachmentPreviewDialogProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const rawFilename = attachment?.filename || 'Document';
  const isUrlFilename = rawFilename.startsWith('http://') || rawFilename.startsWith('https://');
  const displayFilename = isUrlFilename ? 'Evidence Attachment' : rawFilename;
  const url = attachment ? safeAttachmentUrl(attachment.url) : null;

  // Extract clean extension from filename or URL
  const cleanName = rawFilename.split('?')[0]?.split('#')[0] || '';
  const rawExt = cleanName.includes('.') ? cleanName.split('.').pop()?.toLowerCase() || '' : '';
  const urlPath = url ? (() => { try { return new URL(url).pathname.split('?')[0] || ''; } catch { return ''; } })() : '';
  const urlExt = urlPath.includes('.') ? urlPath.split('.').pop()?.toLowerCase() || '' : '';
  const ext = (rawExt && !rawExt.includes('/') && rawExt.length <= 10)
    ? rawExt
    : ((urlExt && !urlExt.includes('/') && urlExt.length <= 10) ? urlExt : '');

  const isMarkdown = ext === 'md' || ext === 'markdown';
  const isText = isMarkdown || ['txt', 'csv', 'json', 'log', 'sol', 'ts', 'js'].includes(ext) || attachment?.mimeType?.startsWith('text/');
  const isKnownImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(ext) || attachment?.mimeType?.startsWith('image/');
  const isPdf = ext === 'pdf' || attachment?.mimeType === 'application/pdf';
  // Try image preview for known images or for unknown binary URLs (e.g. Appwrite storage)
  const shouldTryImage = isKnownImage || (!isText && !isPdf && Boolean(url) && !imageFailed);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageFailed(false);
  }, [open, attachment]);

  useEffect(() => {
    if (!open || !attachment) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTextContent(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (attachment.content) {
      setTextContent(sanitizeMarkdownText(attachment.content));
      return;
    }

    if (isText && url) {
      let active = true;
      setLoading(true);
      setError(null);

      fetch(url)
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const text = await res.text();
          if (active) {
            setTextContent(sanitizeMarkdownText(text));
          }
        })
        .catch((err) => {
          if (active) {
            setError(err instanceof Error ? err.message : 'Failed to fetch document content');
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }
  }, [open, attachment, isText, url]);

  const handleCopy = async () => {
    if (!textContent) return;
    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      toast.success('Document text copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const badgeText = ext ? `.${ext}` : (isKnownImage ? 'IMAGE' : (isPdf ? 'PDF' : 'FILE'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90dvh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-card flex-row items-center justify-between gap-4 space-y-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {isKnownImage || shouldTryImage ? (
                <ImageIcon className="size-5" />
              ) : isMarkdown || isText ? (
                <FileCode className="size-5" />
              ) : (
                <File className="size-5" />
              )}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold truncate text-foreground flex items-center gap-2">
                <span className="truncate">{displayFilename}</span>
                <Badge variant="secondary" className="uppercase text-3xs px-2 py-0.5 shrink-0">
                  {badgeText}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {attachment?.size ? `${formatFileSize(attachment.size)} • ` : ''}
                In-app Document Preview
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pr-8">
            {isText && textContent && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1.5 rounded-lg"
                onClick={handleCopy}
              >
                {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            )}

            {url && (
              <>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1.5 rounded-lg"
                >
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5" />
                    <span className="hidden sm:inline">Open Raw</span>
                  </a>
                </Button>
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1.5 rounded-lg gradient-primary"
                >
                  <a href={url} download={displayFilename} target="_blank" rel="noopener noreferrer">
                    <Download className="size-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                </Button>
              </>
            )}
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background/50">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="text-sm">Loading document preview...</p>
            </div>
          )}

          {error && (
            <div className="p-6 rounded-2xl border border-destructive/20 bg-destructive/5 text-center space-y-3">
              <p className="text-sm text-destructive font-medium">Failed to load live preview: {error}</p>
              {url && (
                <Button asChild size="sm" variant="outline">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    Open Directly in Browser <ExternalLink className="ml-1.5 size-3.5" />
                  </a>
                </Button>
              )}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Markdown Document Display */}
              {isMarkdown && textContent && (
                <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-xs">
                  <Markdown content={textContent} />
                </div>
              )}

              {/* Monospace Plain Text Display */}
              {!isMarkdown && isText && textContent && (
                <pre className="p-4 rounded-xl border border-border bg-card font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {textContent}
                </pre>
              )}

              {/* Image Display */}
              {shouldTryImage && url && (
                <div className="flex items-center justify-center p-4 rounded-2xl bg-black/5 dark:bg-background border border-border min-h-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={displayFilename}
                    className="max-h-[65dvh] max-w-full rounded-xl object-contain shadow-md"
                    onError={() => setImageFailed(true)}
                  />
                </div>
              )}

              {/* PDF Display */}
              {isPdf && url && (
                <div className="w-full h-[65dvh] rounded-2xl overflow-hidden border border-border shadow-md">
                  <iframe src={url} className="w-full h-full border-0" title={displayFilename} />
                </div>
              )}

              {/* Fallback for binary / unsupported files */}
              {!isText && !shouldTryImage && !isPdf && (
                <div className="p-8 rounded-2xl border border-border bg-card text-center space-y-4 max-w-md mx-auto my-8">
                  <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <File className="size-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">{displayFilename}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ext ? `Direct in-app preview is not available for .${ext} files.` : 'Direct in-app preview is not available for this file type.'}
                    </p>
                  </div>
                  {url && (
                    <Button asChild className="gradient-primary shadow-md rounded-full">
                      <a href={url} download={displayFilename} target="_blank" rel="noopener noreferrer">
                        <Download className="size-4 mr-2" /> Download File
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
