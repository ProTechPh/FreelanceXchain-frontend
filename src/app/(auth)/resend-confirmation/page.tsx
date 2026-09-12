'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Mail, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { GuestGuard } from '@/components/auth/guest-guard';

export default function ResendConfirmationPage() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams?.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const qEmail = searchParams?.get('email');
    if (qEmail && !email) {
      setEmail(qEmail);
    }
  }, [searchParams, email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cooldown > 0) return;
    setLoading(true);
    try {
      await authApi.resendConfirmation(email.trim());
      setSent(true);
      setCooldown(60);
      toast.success('Confirmation email sent.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to resend the confirmation email.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestGuard>
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              <h1 className="flex items-center gap-2">
                {sent ? <CheckCircle2 className="size-5 text-primary" /> : <Mail className="size-5" />}
                {sent ? 'Check your email' : 'Resend confirmation'}
              </h1>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {sent ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  If <span className="font-medium text-foreground">{email}</span> has a pending account, a new confirmation link is on its way.
                </p>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    className="w-full"
                    variant="outline"
                    type="button"
                    disabled={cooldown > 0 || loading}
                    onClick={() => {
                      handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
                    }}
                  >
                    {cooldown > 0 ? (
                      <>
                        <Clock className="mr-2 size-4 text-muted-foreground" />
                        Resend again in {cooldown}s
                      </>
                    ) : (
                      'Resend confirmation email'
                    )}
                  </Button>
                  <Button className="w-full" type="button" variant="ghost" onClick={() => setSent(false)}>
                    Use another email
                  </Button>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <p className="text-sm text-muted-foreground">Enter the address you used to create your account.</p>
                <Field label="Email" htmlFor="confirmation-email">
                  <Input id="confirmation-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </Field>
                <Button className="w-full" type="submit" loading={loading} loadingText="Sending…" disabled={!email.trim() || cooldown > 0}>
                  {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Send confirmation email'}
                </Button>
              </form>
            )}
            <p className="text-center text-sm"><Link href="/login" className="text-primary hover:underline">Back to sign in</Link></p>
          </CardContent>
        </Card>
      </div>
    </GuestGuard>
  );
}

