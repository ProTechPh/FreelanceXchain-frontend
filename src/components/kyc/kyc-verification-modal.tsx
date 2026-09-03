'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { safeAttachmentUrl } from '@/lib/attachment-presentation';

interface KycVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionUrl: string | null;
  onComplete: (status?: string) => void;
}

export function KycVerificationModal({
  open,
  onOpenChange,
  sessionUrl,
  onComplete,
}: KycVerificationModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const safeUrl = sessionUrl ? safeAttachmentUrl(sessionUrl) : null;

  // Reset loading state when modal opens or URL changes
  useEffect(() => {
    if (open) {
      setIsLoading(true);
    }
  }, [open, sessionUrl]);

  // Listen to postMessage events from Didit verification iframe
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const origin = event.origin || '';
      // Allow didit.me domains or local/relative origins
      if (!origin.includes('didit.me')) return;

      const payload = event.data;
      if (!payload || typeof payload !== 'object') return;

      const { type, data } = payload as { type?: string; data?: { status?: string; sessionId?: string } };

      if (type === 'didit:ready') {
        setIsLoading(false);
      } else if (type === 'didit:completed') {
        setIsLoading(false);
        onComplete(data?.status);
      } else if (type === 'didit:close_request' || type === 'didit:cancelled') {
        onOpenChange(false);
      }
    } catch {
      // Ignore unexpected message formats
    }
  }, [onComplete, onOpenChange]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const handleOpenExternal = () => {
    if (safeUrl) {
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-card flex-row items-center justify-between gap-4 space-y-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Shield className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold truncate text-foreground flex items-center gap-2">
                Identity Verification
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Follow the on-screen instructions to verify your document and selfie
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Iframe Viewport */}
        <div className="relative w-full flex-1 min-h-[560px] sm:min-h-[640px] bg-background/50 flex flex-col">
          {safeUrl ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/90 backdrop-blur-xs gap-3">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="size-6 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Starting secure session…</p>
                    <p className="text-xs text-muted-foreground mt-1">Connecting to verification service</p>
                  </div>
                </div>
              )}
              <iframe
                src={safeUrl}
                allow="camera; microphone; fullscreen; autoplay; encrypted-media"
                className="w-full flex-1 min-h-[560px] sm:min-h-[640px] border-0"
                title="Identity Verification Session"
                onLoad={() => setIsLoading(false)}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
              <div className="size-12 rounded-full bg-destructive-subtle text-destructive flex items-center justify-center">
                <AlertCircle className="size-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Unable to load verification session</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The verification session URL is missing or invalid. Please try restarting verification.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="mt-2">
                Close
              </Button>
            </div>
          )}
        </div>

        {/* Footer fallback bar */}
        {safeUrl && (
          <div className="px-4 py-3 border-t border-border bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="text-center sm:text-left">
              Camera not opening or having issues inside the modal?
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleOpenExternal}
              className="h-8 text-xs font-medium text-primary hover:text-primary gap-1"
            >
              <ExternalLink className="size-3.5" />
              Open in separate tab
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
