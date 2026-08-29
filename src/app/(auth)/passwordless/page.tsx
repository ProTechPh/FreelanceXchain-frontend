'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { getApiErrorMessage, isAuthSuccessResponse, isRegistrationRequiredResponse } from '@/lib/auth-contract';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { GuestGuard } from '@/components/auth/guest-guard';

export default function PasswordlessPage() {
  const router = useRouter();
  const completeAuth = useAuthStore((state) => state.completeMfa);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const requestCode = async () => {
    setLoading(true);
    try {
      const { data } = await authApi.requestEmailOtp(email.trim());
      setUserId(data.userId);
      toast.success('A one-time code was sent to your email.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to send an email code.'));
    } finally {
      setLoading(false);
    }
  };

  const requestMagicLink = async () => {
    setLoading(true);
    try {
      await authApi.requestMagicUrl(email.trim());
      toast.success('Magic sign-in link sent. Check your email.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to send a magic link.'));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.verifyPasswordlessToken(userId, code.trim());
      if (isAuthSuccessResponse(data)) {
        completeAuth(data);
        router.replace(`/dashboard/${data.user.role}`);
        return;
      }
      if (isRegistrationRequiredResponse(data)) {
        toast.error('This email has no platform profile yet. Create an account first.');
        router.push('/register');
        return;
      }
      throw new Error('Invalid passwordless response');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'The code is invalid or expired.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestGuard>
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle><h1 className="flex items-center gap-2"><KeyRound className="size-5" />Passwordless sign in</h1></CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <Field label="Email" htmlFor="passwordless-email">
              <Input id="passwordless-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </Field>
            <div className="grid grid-cols-2 gap-3"><Button type="button" disabled={loading || !email.trim()} onClick={() => void requestCode()}><Mail className="mr-2 size-4" />Email code</Button><Button type="button" variant="outline" disabled={loading || !email.trim()} onClick={() => void requestMagicLink()}>Magic link</Button></div>
            {userId && (
              <form className="space-y-3 border-t border-border pt-5" onSubmit={verifyCode}>
                <Field label="One-time code" htmlFor="passwordless-code">
                  <Input id="passwordless-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} />
                </Field>
                <Button className="w-full" type="submit" disabled={loading || !code.trim()}>Verify and sign in</Button>
              </form>
            )}
            <p className="text-center text-sm text-muted-foreground"><Link href="/login" className="text-primary hover:underline">Back to password sign in</Link></p>
          </CardContent>
        </Card>
      </div>
    </GuestGuard>
  );
}

