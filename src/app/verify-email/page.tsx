'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import { authApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loadUser } = useAuthStore();

  const userId = searchParams?.get('userId');
  const secret = searchParams?.get('secret');

  const hasParams = Boolean(userId && secret);
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(hasParams ? 'verifying' : 'error');
  const [errorMessage, setErrorMessage] = useState<string>(
    hasParams ? '' : 'Invalid or missing verification link parameters.'
  );

  useEffect(() => {
    if (!userId || !secret) {
      return;
    }

    let active = true;

    async function performVerification() {
      try {
        await authApi.verifyEmail(userId!, secret!);
        if (!active) return;
        setStatus('success');
        // Refresh authenticated user state so verified status takes effect immediately
        if (isAuthenticated) {
          void loadUser();
        }
      } catch (err: unknown) {
        if (!active) return;
        setStatus('error');
        setErrorMessage(
          getApiErrorMessage(err, 'Verification failed. The link may be expired or already used.')
        );
      }
    }

    void performVerification();

    return () => {
      active = false;
    };
  }, [userId, secret, isAuthenticated, loadUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
            {status === 'verifying' && <Loader2 className="size-6 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle2 className="size-6 text-success" />}
            {status === 'error' && <XCircle className="size-6 text-destructive" />}
          </div>
          <CardTitle>
            {status === 'verifying' && 'Verifying your email'}
            {status === 'success' && 'Email verified!'}
            {status === 'error' && 'Verification failed'}
          </CardTitle>
          <CardDescription>
            {status === 'verifying' && 'Please wait while we confirm your email address…'}
            {status === 'success' && 'Your email address has been successfully verified.'}
            {status === 'error' && errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="space-y-3">
              {isAuthenticated ? (
                <Button className="w-full gap-2" onClick={() => router.push(`/dashboard/${user?.role || 'freelancer'}`)}>
                  Continue to Dashboard
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button className="w-full gap-2" asChild>
                  <Link href="/login">
                    Sign in to your account
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <Button className="w-full gap-2" asChild>
                <Link href="/resend-confirmation">
                  <Mail className="size-4" />
                  Request new verification link
                </Link>
              </Button>
              <p className="text-center text-sm">
                <Link href="/login" className="text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
              <CardTitle>Verifying your email</CardTitle>
              <CardDescription>Loading verification details…</CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
