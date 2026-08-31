'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { SignInPage } from '@/components/marketing/sign-in';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { authApi } from '@/lib/api';
import { GuestGuard } from '@/components/auth/guest-guard';

export default function LoginPage() {
  const { login } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

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
    setOauthError(null);
    try {
      const { data } = await authApi.oauthLogin(provider);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `${apiUrl}/auth/oauth/${provider}`;
    } catch (error) {
      const msg = getApiErrorMessage(error, 'Too many sign-in attempts. Please try again later.');
      setOauthError(msg);
      toast.error(msg);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSigningIn) return;

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    setIsSigningIn(true);
    setOauthError(null); // Clear any OAuth error when trying email sign-in

    try {
      const result = await login(email, password);

      if (result.mfaRequired) {
        router.push('/mfa/verify');
        return;
      }

      toast.success('Welcome back!');
      const user = useAuthStore.getState().user;
      router.replace(`/dashboard/${user?.role || 'freelancer'}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to sign in. Please try again.'), { duration: 5000 });
      setIsSigningIn(false);
    }
  };

  return (
    <GuestGuard>
      <SignInPage
        homeHref="/"
        onSignIn={handleSignIn}
        loading={isSigningIn}
        onGoogleSignIn={() => handleOAuth('google')}
        onGithubSignIn={() => handleOAuth('github')}
        onResetPassword={() => router.push('/forgot-password')}
        onResendConfirmation={() => router.push('/resend-confirmation')}
        onCreateAccount={() => router.push('/register')}
        onPasswordlessSignIn={() => router.push('/passwordless')}
        oauthError={oauthError}
      />
    </GuestGuard>
  );
}

