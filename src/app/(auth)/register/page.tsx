'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { SignUpPage } from '@/components/marketing/sign-up';
import type { UserRole } from '@/types';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { authApi } from '@/lib/api';
import { GuestGuard } from '@/components/auth/guest-guard';
import { TurnstileWidget, type TurnstileWidgetRef } from '@/components/auth/turnstile-widget';

export default function RegisterPage() {
  const { register, logout, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  // Parse OAuth error from URL query parameters
  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (errorParam) {
      queueMicrotask(() => {
        try {
          const errorData = JSON.parse(decodeURIComponent(errorParam));
          setOauthError(errorData.message || 'Registration failed. Please try again.');
        } catch {
          // If not JSON, use the raw error string
          setOauthError(decodeURIComponent(errorParam));
        }
        // Clear the error from URL without reloading
        window.history.replaceState({}, '', '/register');
      });
    }
  }, [searchParams]);

  const handleOAuth = async (provider: 'google' | 'github') => {
    if (isLoading || oauthLoading) return;
    setOauthLoading(provider);
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
      setOauthLoading(null);
      const msg = getApiErrorMessage(error, 'Too many attempts. Please try again later.');
      setOauthError(msg);
      toast.error(msg);
    }
  };

  const handleSubmit = async (data: { email: string; password: string; role: UserRole }) => {
    if (isLoading || oauthLoading) return;
    try {
      await register(data.email, data.password, data.role, turnstileToken || undefined);
      try {
        await logout();
      } catch {
        // Best effort session cleanup
      }
      toast.success('Registration successful!', {
        description: 'Please check your email and click the verification link before logging in.',
        duration: 9000,
      });
      router.replace('/login');
    } catch (error) {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      toast.error(getApiErrorMessage(error, 'Registration failed. Please try again.'));
    }
  };

  return (
    <GuestGuard>
      <SignUpPage
        onSubmit={handleSubmit}
        onGoogleSignIn={() => void handleOAuth('google')}
        onGithubSignIn={() => void handleOAuth('github')}
        onSignIn={() => router.push('/login')}
        isLoading={isLoading}
        oauthLoading={oauthLoading}
        oauthError={oauthError}
        turnstileSlot={
          <TurnstileWidget
            ref={turnstileRef}
            action="signup"
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
          />
        }
      />
    </GuestGuard>
  );
}

