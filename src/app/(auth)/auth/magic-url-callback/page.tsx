'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { getApiErrorMessage, isAuthSuccessResponse, isRegistrationRequiredResponse } from '@/lib/auth-contract';
import { useAuthStore } from '@/stores/authStore';

function MagicUrlCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const completeAuth = useAuthStore((state) => state.completeMfa);
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
      .catch((error) => toast.error(getApiErrorMessage(error, 'This magic link is invalid or expired.')));
  }, [completeAuth, router, secret, userId]);

  if (!userId || !secret) {
    return <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center"><h1 className="text-2xl font-bold">Invalid magic link</h1><p className="text-muted-foreground">The sign-in link is missing its verification token.</p><Link href="/passwordless" className="text-primary hover:underline">Request another link</Link></div>;
  }
  return <div className="flex min-h-screen items-center justify-center" role="status"><Loader2 className="size-8 animate-spin text-primary" /><span className="sr-only">Completing passwordless sign in</span></div>;
}

export default function MagicUrlCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center" role="status">Loading magic link…</div>}>
      <MagicUrlCallbackContent />
    </Suspense>
  );
}
