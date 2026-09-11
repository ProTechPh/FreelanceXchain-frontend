'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { Shield, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { getApiErrorMessage, isAuthSuccessResponse } from '@/lib/auth-contract';
import { Field } from '@/components/ui/field';

export default function MfaVerifyPage() {
  const [code, setCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const verificationCompleted = useRef(false);
  const { user, isAuthenticated, hasHydrated, mfaPending, mfaSessionToken, completeMfa, clearMfa } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && isAuthenticated && user && !mfaPending) {
      router.replace(`/dashboard/${user.role || 'freelancer'}`);
      return;
    }
    if (hasHydrated && !verificationCompleted.current && (!mfaPending || !mfaSessionToken)) {
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, user, mfaPending, mfaSessionToken, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaSessionToken) return;

    setIsVerifying(true);
    try {
      const { data } = await authApi.mfaVerify({
        mfaSessionToken,
        factorId: 'totp',
        code: code.trim(),
      });

      if (!isAuthSuccessResponse(data)) {
        throw new Error('The server returned an invalid MFA response');
      }

      verificationCompleted.current = true;
      completeMfa(data);
      toast.success('MFA verified!');
      router.push(`/dashboard/${data.user.role}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, useRecoveryCode ? 'Invalid recovery code' : 'Invalid verification code'), { duration: 5000 });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    clearMfa();
    router.push('/login');
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background" role="status">
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="sr-only">Loading verification session…</span>
      </div>
    );
  }

  if (!mfaPending || !mfaSessionToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Session expired</h1>
            <p className="text-muted-foreground mt-2">
              Your MFA session has expired. Please sign in again to continue.
            </p>
          </div>
          <Button asChild variant="gradient" className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
            {useRecoveryCode ? (
              <KeyRound className="w-8 h-8 text-primary-foreground" />
            ) : (
              <Shield className="w-8 h-8 text-primary-foreground" />
            )}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            {useRecoveryCode ? 'Backup Recovery Code' : 'Two-Factor Authentication'}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {useRecoveryCode
              ? 'Enter one of your emergency backup codes saved during MFA setup'
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={useRecoveryCode ? 'Recovery Code' : 'Verification Code'} htmlFor="code">
            {useRecoveryCode ? (
              <Input
                id="code"
                type="text"
                autoComplete="off"
                placeholder="e.g. a1b2-c3d4-e5f6"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={36}
                className="text-center text-lg tracking-wider font-mono h-12"
                required
                autoFocus
              />
            ) : (
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-[0.5em] font-mono h-12"
                required
                autoFocus
              />
            )}
          </Field>

          <Button
            type="submit"
            variant="gradient"
            className="w-full"
            disabled={isVerifying || (useRecoveryCode ? !code.trim() : code.length !== 6)}
          >
            {isVerifying ? 'Verifying…' : 'Verify'}
          </Button>
        </form>

        <div className="flex flex-col items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              setUseRecoveryCode((prev) => !prev);
              setCode('');
            }}
            className="min-h-[44px] text-xs text-primary hover:underline inline-flex items-center"
          >
            {useRecoveryCode
              ? '← Use 6-digit authenticator code instead'
              : 'Lost access to your phone? Enter a backup recovery code'}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="min-h-[44px] flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
