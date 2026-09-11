'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { getApiErrorMessage, isAuthSuccessResponse, isRegistrationRequiredResponse } from '@/lib/auth-contract';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';

function MagicUrlCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const completeAuth = useAuthStore((state) => state.completeMfa);
  const [error, setError] = useState<string | null>(null);
  const userId = searchParams?.get('userId') || '';
  const secret = searchParams?.get('secret') || '';

  useEffect(() => {
    if (!userId || !secret) return;
    authApi.verifyPasswordlessToken(userId, secret)
      .then(({ data }) => {
        if (isAuthSuccessResponse(data)) {
          completeAuth(data);
          router.replace(`/dashboard/${data.user.role}`);
        } else if (isRegistrationRequiredResponse(data)) {
          toast.error('Create a platform account before using passwordless sign in.');
          router.replace('/register');
        } else {
          throw new Error('Invalid passwordless response');
        }
      })
      .catch((err) => {
        const message = getApiErrorMessage(err, 'This magic link is invalid or expired.');
        setError(message);
        toast.error(message);
      });
  }, [completeAuth, router, secret, userId]);

  if (!userId || !secret) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center bg-background">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Invalid magic link</h1>
          <p className="text-sm text-muted-foreground">The sign-in link is missing its verification token.</p>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full">
              <Link href="/passwordless">Request new sign-in link</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md text-center rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Sign-in link expired</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full">
              <Link href="/passwordless">Request new sign-in link</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background" role="status">
      <Loader2 className="size-8 animate-spin text-primary" />
      <span className="sr-only">Completing passwordless sign in</span>
    </div>
  );
}

export default function MagicUrlCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background" role="status">
          <Loader2 className="size-8 animate-spin text-primary" />
          <span className="sr-only">Loading magic link…</span>
        </div>
      }
    >
      <MagicUrlCallbackContent />
    </Suspense>
  );
}
