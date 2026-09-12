'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { CheckCircle, Mail } from 'lucide-react';
import { Field } from '@/components/ui/field';
import { GuestGuard } from '@/components/auth/guest-guard';
import { TurnstileWidget, type TurnstileWidgetRef } from '@/components/auth/turnstile-widget';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email, turnstileToken || undefined);
      setSent(true);
      toast.success('Reset link sent!');
    } catch {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      toast.error('Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GuestGuard>
      {sent ? (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Check your email</h1>
              <p className="text-muted-foreground mt-2">
                We&apos;ve sent a password reset link to<br className="hidden sm:inline" />
                <span className="font-medium text-foreground">{email}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">Don&apos;t see it? Check your spam/junk folder. It may take a few minutes.</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Didn&apos;t receive the email?{' '}
              <button onClick={() => { setSent(false); }} className="text-primary hover:underline font-medium">
                Try again
              </button>
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">
                Back to sign in
              </Link>
            </Button>
            <div className="pt-4 border-t border-border mt-6">
              <p className="text-sm text-muted-foreground">
                Need more help?{' '}
                <Link href="/contact" className="text-primary hover:underline font-medium">
                  Contact support
                </Link>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Forgot password?</h1>
              <p className="text-muted-foreground mt-1">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              <div className="flex justify-center my-2">
                <TurnstileWidget
                  ref={turnstileRef}
                  action="password_reset"
                  onVerify={setTurnstileToken}
                  onExpire={() => setTurnstileToken(null)}
                />
              </div>

              <Button type="submit" variant="gradient" className="w-full" loading={isLoading} loadingText="Sending...">Send reset link</Button>

              <Button asChild variant="ghost" className="w-full">
                <Link href="/login">
                  ← Back to sign in
                </Link>
              </Button>
            </form>
          </div>
        </div>
      )}
    </GuestGuard>
  );
}

