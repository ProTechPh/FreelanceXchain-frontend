'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { GuestGuard } from '@/components/auth/guest-guard';

export default function ResendConfirmationPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await authApi.resendConfirmation(email.trim());
      setSent(true);
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
              <p className="text-sm text-muted-foreground">
                If <span className="font-medium text-foreground">{email}</span> has a pending account, a new confirmation link is on its way.
              </p>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <p className="text-sm text-muted-foreground">Enter the address you used to create your account.</p>
                <Field label="Email" htmlFor="confirmation-email">
                  <Input id="confirmation-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </Field>
                <Button className="w-full" type="submit" loading={loading} loadingText="Sending…" disabled={!email.trim()}>Send confirmation email</Button>
              </form>
            )}
            {sent && <Button className="w-full" type="button" variant="outline" onClick={() => setSent(false)}>Use another email</Button>}
            <p className="text-center text-sm"><Link href="/login" className="text-primary hover:underline">Back to sign in</Link></p>
          </CardContent>
        </Card>
      </div>
    </GuestGuard>
  );
}

