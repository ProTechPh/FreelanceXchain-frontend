'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { SignUpPage } from '@/components/marketing/sign-up';
import type { UserRole } from '@/types';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { authApi } from '@/lib/api';
import { GuestGuard } from '@/components/auth/guest-guard';
import { TurnstileWidget, type TurnstileWidgetRef } from '@/components/auth/turnstile-widget';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  const { register, logout, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetRef>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

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
      setRegisteredEmail(data.email);
    } catch (error) {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      toast.error(getApiErrorMessage(error, 'Registration failed. Please try again.'));
    }
  };

  if (registeredEmail) {
    return (
      <GuestGuard>
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4 sm:p-6">
          <Card className="w-full max-w-md shadow-lg border-border/80">
            <CardHeader className="text-center pb-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Check your email
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                We&apos;ve sent an activation link to:
              </CardDescription>
              <p className="font-semibold text-foreground text-base mt-1 break-all">
                {registeredEmail}
              </p>
            </CardHeader>
            <CardContent className="space-y-5 text-center pt-2">
              <div className="bg-muted/60 rounded-xl p-3.5 text-xs text-muted-foreground text-left space-y-1.5 border border-border/50">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-primary shrink-0" /> Next steps:
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Click the verification link in the email.</li>
                  <li>Log in to access your dashboard.</li>
                  <li>Check spam or junk if you don&apos;t see it within 2 minutes.</li>
                </ol>
              </div>

              <div className="space-y-2.5 pt-2">
                <Button asChild className="w-full h-11" variant="gradient">
                  <Link href="/login">
                    Go to Sign In
                    <ArrowRight className="size-4 ml-1.5" />
                  </Link>
                </Button>

                <p className="text-xs text-muted-foreground pt-1">
                  Didn&apos;t receive the email?{' '}
                  <Link
                    href={`/resend-confirmation?email=${encodeURIComponent(registeredEmail)}`}
                    className="text-primary hover:underline font-semibold"
                  >
                    Resend verification link
                  </Link>
                </p>
              </div>

              <div className="pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRegisteredEmail(null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mistyped your email? Register with a different address
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </GuestGuard>
    );
  }

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

