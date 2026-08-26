'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, LoaderCircle, ShieldAlert, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';
import {
  getApiErrorMessage,
  getAuthCallbackToken,
  isAuthSuccessResponse,
  isMfaRequiredResponse,
  isRegistrationRequiredResponse,
} from '@/lib/auth-contract';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

type CallbackState = 'processing' | 'registration' | 'error';

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const completeMfa = useAuthStore((state) => state.completeMfa);
  const beginMfa = useAuthStore((state) => state.beginMfa);
  const processed = useRef(false);
  const accessTokenRef = useRef<string | null>(null);
  const [state, setState] = useState<CallbackState>('processing');
  const [errorMessage, setErrorMessage] = useState('The OAuth response was invalid or incomplete.');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const queryParams = new URLSearchParams(searchParams?.toString() ?? '');
    const providerError = queryParams.get('error_description') || queryParams.get('error');
    if (providerError) {
      queueMicrotask(() => {
        setErrorMessage(providerError);
        setState('error');
      });
      return;
    }

    const fragmentParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const userId = queryParams.get('userId') || fragmentParams.get('userId') || undefined;
    const secret = queryParams.get('secret') || fragmentParams.get('secret') || undefined;
    const token = getAuthCallbackToken(queryParams, fragmentParams);
    if (!token && !secret) {
      queueMicrotask(() => setState('error'));
      return;
    }

    const payload = userId && secret
      ? { userId, secret, access_token: secret }
      : { access_token: (token || secret)! };

    accessTokenRef.current = token || secret || null;
    authApi.oauthCallback(payload)
      .then(({ data }) => {
        if (isMfaRequiredResponse(data)) {
          beginMfa(data.mfaSessionToken);
          router.replace('/mfa/verify');
          return;
        }

        if (isRegistrationRequiredResponse(data)) {
          if (data.access_token) {
            accessTokenRef.current = data.access_token;
          }
          setState('registration');
          return;
        }

        if (!isAuthSuccessResponse(data)) {
          throw new Error('The server returned an invalid OAuth response.');
        }

        completeMfa(data);
        router.replace(`/dashboard/${data.user.role}`);
      })
      .catch((error) => {
        setErrorMessage(getApiErrorMessage(error, 'OAuth sign-in failed. Please try again.'));
        setState('error');
      });
  }, [beginMfa, completeMfa, router, searchParams]);

  const completeRegistration = async (role: Exclude<UserRole, 'admin'>) => {
    const accessToken = accessTokenRef.current;
    if (!accessToken) return;

    setIsRegistering(true);
    try {
      const { data } = await authApi.oauthRegister(accessToken, role);
      if (!isAuthSuccessResponse(data)) {
        throw new Error('The server returned an invalid registration response.');
      }

      completeMfa(data);
      router.replace(`/dashboard/${data.user.role}`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Unable to complete OAuth registration.'));
      setState('error');
    } finally {
      setIsRegistering(false);
    }
  };

  if (state === 'registration') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Complete your registration</h1>
          <p className="mt-2 text-muted-foreground">
            Choose how you will use FreelanceXchain. This controls your dashboard and available actions.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-28 flex-col gap-2 whitespace-normal p-4"
            disabled={isRegistering}
            onClick={() => completeRegistration('freelancer')}
          >
            <UserRound className="size-6" aria-hidden="true" />
            <span>Freelancer</span>
            <span className="text-xs font-normal text-muted-foreground">Find projects and submit proposals</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-28 flex-col gap-2 whitespace-normal p-4"
            disabled={isRegistering}
            onClick={() => completeRegistration('employer')}
          >
            <Briefcase className="size-6" aria-hidden="true" />
            <span>Employer</span>
            <span className="text-xs font-normal text-muted-foreground">Post projects and hire talent</span>
          </Button>
        </div>
        {isRegistering && <p role="status" className="text-center text-sm text-muted-foreground">Creating your account…</p>}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="size-8 text-destructive" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Unable to sign in</h1>
          <p role="alert" className="mt-2 text-muted-foreground">{errorMessage}</p>
        </div>
        <Button asChild variant="gradient" className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center" role="status" aria-live="polite">
      <LoaderCircle className="mx-auto size-10 animate-spin text-primary" aria-hidden="true" />
      <h1 className="text-xl font-semibold">Completing secure sign-in</h1>
      <p className="text-sm text-muted-foreground">Keep this page open while we verify your account.</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <Suspense fallback={<p role="status">Loading OAuth response…</p>}>
          <OAuthCallbackContent />
        </Suspense>
      </div>
    </div>
  );
}
