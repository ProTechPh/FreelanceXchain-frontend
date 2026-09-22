'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/navbar';
import { FooterSection } from '@/components/layout/footer-section';
import { MailCheck, CheckCircle2, ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const [email, setEmail] = useState(emailParam);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    // Simulate or call email preference unsubscribe endpoint
    setTimeout(() => {
      setLoading(false);
      setUnsubscribed(true);
      toast.success('Successfully unsubscribed from marketing and promotional communications.');
    }, 800);
  };

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6">
      <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-10 shadow-xl shadow-black/5 text-center">
        {!unsubscribed ? (
          <form onSubmit={handleUnsubscribe} className="space-y-6">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MailCheck className="size-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                Email Preferences & Unsubscribe
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                We respect your inbox. You can unsubscribe from marketing campaigns, newsletters, and promotional announcements with a single click.
              </p>
            </div>

            <div className="space-y-2 text-left">
              <label htmlFor="unsub-email" className="text-xs font-bold text-foreground">
                Confirm your email address:
              </label>
              <input
                id="unsub-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-background border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-left text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldAlert className="size-3.5 text-primary" />
                <span>Important account updates:</span>
              </p>
              <p>
                You will still receive essential emails about your contracts, payments, and password resets so you never miss critical updates.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Updating preferences…
                </>
              ) : (
                'Unsubscribe from All Marketing Emails'
              )}
            </Button>

            <div className="pt-2 text-xs text-muted-foreground">
              Have an active account?{' '}
              <Link href="/dashboard/freelancer/settings" className="text-primary font-semibold hover:underline">
                Manage Granular Notifications in Settings
              </Link>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success-subtle text-success">
              <CheckCircle2 className="size-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                Unsubscribed Successfully
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Your email (<strong>{email}</strong>) has been removed from our marketing mailing lists. It may take up to 24 hours to take full effect across all automated queue workers.
              </p>
            </div>

            <div className="pt-4 flex flex-col gap-2.5">
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href="/">
                  <ArrowLeft className="size-4 mr-2" />
                  Return to FreelanceXchain Home
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="grow pt-28 sm:pt-36 pb-20 flex items-center">
        <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Loading...</div>}>
          <UnsubscribeContent />
        </Suspense>
      </main>
      <FooterSection />
    </div>
  );
}
