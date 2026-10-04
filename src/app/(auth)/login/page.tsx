'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { SignInPage } from '@/components/marketing/sign-in';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { authApi } from '@/lib/api';
import { API_URL } from '@/lib/api-client';
import { GuestGuard } from '@/components/auth/guest-guard';
import { TurnstileWidget, type TurnstileWidgetRef } from '@/components/auth/turnstile-widget';
import { getLastUsedOAuthProvider, setLastUsedOAuthProvider, type OAuthProvider } from '@/lib/last-used-auth';

export default function LoginPage() {
  const { login } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [lockoutError, setLockoutError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [lastUsedOAuth, setLastUsedOAuth] = useState<OAuthProvider | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  // Restore last used OAuth provider from client storage
  useEffect(() => {
    setLastUsedOAuth(getLastUsedOAuthProvider());
  }, []);

  // Parse OAuth error from URL query parameters
  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (errorParam) {
      queueMicrotask(() => {
        try {
          const errorData = JSON.parse(decodeURIComponent(errorParam));
          setOauthError(errorData.message || 'Sign-in failed. Please try again.');
        } catch {
          // If not JSON, use the raw error string
          setOauthError(decodeURIComponent(errorParam));
        }
        // Clear the error from URL without reloading
        window.history.replaceState({}, '', '/login');
      });
    }
  }, [searchParams]);

  const handleOAuth = async (provider: 'google' | 'github') => {
    if (isSigningIn || oauthLoading) return;
    setLastUsedOAuthProvider(provider);
    setLastUsedOAuth(provider);
    setOauthLoading(provider);
    setOauthError(null);
    try {
      const { data } = await authApi.oauthLogin(provider);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      const apiUrl = API_URL;
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `${apiUrl}/auth/oauth/${provider}`;
    } catch (error) {
      setOauthLoading(null);
      const msg = getApiErrorMessage(error, 'Couldn\'t connect with that provider. Try again or sign in with email.');
      setOauthError(msg);
      toast.error(msg);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSigningIn || oauthLoading) return;

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    setIsSigningIn(true);
    setOauthError(null); // Clear any OAuth error when trying email sign-in
    setLockoutError(null); // Clear any previous lockout error

    try {
      const result = await login(email, password, turnstileToken || undefined);

      if (result.mfaRequired) {
        router.push('/mfa/verify');
        return;
      }

      toast.success('Welcome back!');
      const user = useAuthStore.getState().user;
      router.replace(`/dashboard/${user?.role || 'freelancer'}`);
    } catch (error: unknown) {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      const err = error as {
        response?: {
          status?: number;
          data?: { error?: { code?: string; message?: string } };
        };
        code?: string;
      } | undefined;
      const statusCode = err?.response?.status;
      const errCode = err?.response?.data?.error?.code || err?.code;
      const serverMessage = err?.response?.data?.error?.message;
      const msg = getApiErrorMessage(error, "Couldn't sign in. Check your email and password, then try again.");

      if (
        errCode === 'ACCOUNT_LOCKED' ||
        statusCode === 423 ||
        msg.toLowerCase().includes('temporarily locked') ||
        (serverMessage && serverMessage.toLowerCase().includes('locked'))
      ) {
        const lockMsg =
          serverMessage ||
          'Your account has been temporarily locked due to repeated login failures. Please try again after 15 minutes or reset your password.';
        setLockoutError(lockMsg);
        toast.error('Account Temporarily Locked', {
          description: lockMsg,
          duration: 10000,
          action: {
            label: 'Reset password',
            onClick: () => router.push('/forgot-password'),
          },
        });
      } else if (errCode === 'EMAIL_NOT_VERIFIED' || msg.toLowerCase().includes('verify your email')) {
        toast.error('Email Verification Required', {
          description: msg,
          duration: 10000,
          action: {
            label: 'Resend link',
            onClick: async () => {
              try {
                await authApi.resendConfirmation(email);
                toast.success('Verification link resent!', {
                  description: 'Please check your email inbox.',
                });
              } catch {
                toast.error("Couldn't resend the verification email. Try again in a moment.");
              }
            },
          },
        });
      } else {
        toast.error(msg, { duration: 5000 });
      }
      setIsSigningIn(false);
    }
  };

  return (
    <GuestGuard>
      <SignInPage
        homeHref="/"
        onSignIn={handleSignIn}
        loading={isSigningIn}
        oauthLoading={oauthLoading}
        lastUsedOAuthProvider={lastUsedOAuth}
        onGoogleSignIn={() => handleOAuth('google')}
        onGithubSignIn={() => handleOAuth('github')}
        onResetPassword={() => router.push('/forgot-password')}
        onResendConfirmation={() => router.push('/resend-confirmation')}
        onCreateAccount={() => router.push('/register')}
        onPasswordlessSignIn={() => router.push('/passwordless')}
        oauthError={oauthError}
        lockoutError={lockoutError}
        turnstileSlot={
          <TurnstileWidget
            ref={turnstileRef}
            action="login"
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
          />
        }
      />
    </GuestGuard>
  );
}

