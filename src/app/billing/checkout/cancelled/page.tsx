'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CircleSlash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { getBillingReturnPath } from '@/lib/billing-checkout';

/**
 * Where Stripe sends the browser when the user backs out of Checkout.
 *
 * Neutral in tone: cancelling is a normal choice, not a failure, and the copy
 * says plainly that no money moved.
 */
function CheckoutCancelledContent() {
  const searchParams = useSearchParams();
  const role = useAuthStore((state) => state.user?.role);

  const returnPath = getBillingReturnPath(
    searchParams?.get('returnTo'),
    `/dashboard/${role ?? 'freelancer'}`,
  );

  return (
    <div className="space-y-4 text-center">
      <CircleSlash className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-xl font-semibold text-foreground">Checkout cancelled</h1>
      <p className="text-sm text-muted-foreground">
        No charge was made. Your account is unchanged and everything on the Free plan still works.
      </p>
      <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
        <Button asChild variant="outline">
          <Link href={returnPath}>Back</Link>
        </Button>
        <Button asChild variant="gradient">
          <Link href="/pricing">See plans</Link>
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutCancelledPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <Suspense fallback={null}>
          <CheckoutCancelledContent />
        </Suspense>
      </div>
    </div>
  );
}
