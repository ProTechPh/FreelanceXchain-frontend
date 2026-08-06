'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api';
import {
  getApiErrorMessage,
  getPasswordResetToken,
  getRegistrationFormError,
} from '@/lib/auth-contract';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const accessToken = getPasswordResetToken(
    new URLSearchParams(searchParams?.toString() ?? ''),
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!accessToken) {
      setFormError('This password reset link is invalid or incomplete.');
      return;
    }

    const validationError = getRegistrationFormError(password, confirmPassword, true);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      await authApi.resetPassword(accessToken, password);
      setComplete(true);
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'This reset link is invalid or has expired.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (complete) {
    return (
      <div className="space-y-6 text-center" role="status">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle className="size-8 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Password updated</h1>
          <p className="mt-2 text-muted-foreground">
            Your password has been changed. Sign in again on all of your devices.
          </p>
        </div>
        <Button asChild variant="gradient" className="w-full">
          <Link href="/login">Continue to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="size-8 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold">Choose a new password</h1>
        <p className="mt-2 text-muted-foreground">
          Use a unique password you have not used on this account before.
        </p>
      </div>

      {!accessToken && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          This reset link is missing its recovery token. Request a new email to continue.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFormError(null);
            }}
            aria-describedby="password-requirements reset-error"
            required
          />
          <p id="password-requirements" className="text-xs text-muted-foreground">
            8–72 characters with uppercase, lowercase, a number, and @$!%*?&amp;.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setFormError(null);
            }}
            aria-describedby="reset-error"
            required
          />
        </div>

        {formError && (
          <p id="reset-error" role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" variant="gradient" className="w-full" disabled={!accessToken || isSubmitting}>
          {isSubmitting ? 'Updating password…' : 'Update password'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Need another link?{' '}
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          Request a new reset email
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <Suspense fallback={<p role="status">Loading password reset…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
