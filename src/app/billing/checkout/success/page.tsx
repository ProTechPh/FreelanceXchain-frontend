'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { hasProAccess } from '@/lib/plan-access';
import {
  CHECKOUT_MAX_ATTEMPTS,
  nextPollDelay,
  resolveCheckoutState,
  getBillingReturnPath,
  type CheckoutState,
} from '@/lib/billing-checkout';

/**
 * Where Stripe sends the browser after a successful Checkout.
 *
 * Deliberately NOT under /dashboard: DashboardLayout runs its own loadUser(),
 * can redirect on role and can open the first-login KYC modal, any of which
 * would race this polling loop or cover the confirmation.
 *
 * Entitlement is granted by webhook, which can land just after this redirect,
 * so the page polls /auth/me. It never says "you are on Free" — reaching this
 * page means the payment succeeded; only activation can be pending.
 */
function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const refreshPlan = useAuthStore((state) => state.refreshPlan);
  const user = useAuthStore((state) => state.user);

  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<CheckoutState>('waiting');
  const started = useRef(false);

  const returnPath = getBillingReturnPath(
    searchParams?.get('returnTo'),
    `/dashboard/${user?.role ?? 'freelancer'}`,
  );

  const poll = useCallback(async () => {
    for (let i = 0; i < CHECKOUT_MAX_ATTEMPTS; i += 1) {
      const delay = nextPollDelay(i);
      if (delay === null) break;
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));

      await refreshPlan();

      if (hasProAccess(useAuthStore.getState().user)) {
        setState('confirmed');
        return;
      }
      setAttempt(i + 1);
    }

    setState(resolveCheckoutState({ isPro: false, attempt: CHECKOUT_MAX_ATTEMPTS }));
  }, [refreshPlan]);

  useEffect(() => {
    // A ref guard rather than a dep list: StrictMode double-invokes effects in
    // development and this loop must run exactly once.
    if (started.current) return;
    started.current = true;
    void poll();
  }, [poll]);

  useEffect(() => {
    if (state !== 'confirmed') return;
    const timer = setTimeout(() => router.replace(returnPath), 1500);
    return () => clearTimeout(timer);
  }, [state, router, returnPath]);

  if (state === 'confirmed') {
    return (
      <div className="space-y-4 text-center" role="status" aria-live="polite">
        <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-foreground">You&apos;re on Pro</h1>
        <p className="text-sm text-muted-foreground">All Pro features are unlocked.</p>
        {/* An explicit control as well as the redirect, for anyone using
            reduced motion or a screen reader. */}
        <Button asChild variant="gradient">
          <Link href={returnPath}>Go to dashboard</Link>
        </Button>
      </div>
    );
  }

  if (state === 'timed-out') {
    return (
      <div className="space-y-4 text-center">
        <Clock className="mx-auto size-10 text-warning" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-foreground">
          Payment received — activation is taking longer than usual
        </h1>
        <p className="text-sm text-muted-foreground">
          Your payment went through. Pro usually appears within a minute.
        </p>
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setState('waiting');
              setAttempt(0);
              void poll();
            }}
          >
            Check again
          </Button>
          <Button asChild variant="gradient">
            <Link href={`/dashboard/${user?.role ?? 'freelancer'}/billing`}>Go to billing</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Still not showing?{' '}
          <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center" role="status" aria-live="polite">
      <LoaderCircle className="mx-auto size-10 animate-spin text-primary" aria-hidden="true" />
      <h1 className="text-xl font-semibold text-foreground">Payment received</h1>
      <p className="text-sm text-muted-foreground">
        We&apos;re activating Pro on your account. This usually takes a few seconds.
      </p>
      <span className="sr-only">Activation attempt {attempt + 1}</span>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <Suspense
          fallback={
            <div className="space-y-4 text-center" role="status" aria-live="polite">
              <LoaderCircle className="mx-auto size-10 animate-spin text-primary" aria-hidden="true" />
              <h1 className="text-xl font-semibold text-foreground">Payment received</h1>
              <p className="text-sm text-muted-foreground">Activating your Pro plan…</p>
            </div>
          }
        >
          <CheckoutSuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
