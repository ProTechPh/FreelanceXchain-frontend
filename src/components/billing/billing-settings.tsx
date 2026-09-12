'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanComparison } from '@/components/billing/plan-comparison';
import { UpgradeButton } from '@/components/billing/upgrade-button';
import { IntervalToggle } from '@/components/billing/interval-toggle';
import { usePlan, usePlans, useSubscription, useOpenBillingPortal } from '@/hooks/use-plan';
import { useAuthStore } from '@/stores/authStore';
import { formatDate } from '@/lib/format';
import { computeAnnualSaving, findPrice, formatPrice, priceLabel } from '@/lib/plan-pricing';
import { describeTrialIneligibility } from '@/lib/trial-eligibility';
import type { BillingInterval } from '@/types';

export function BillingSettings() {
  const { isPro, isAdmin, isResolved } = usePlan();
  const refreshPlan = useAuthStore((state) => state.refreshPlan);
  const { data: subscription, isLoading } = useSubscription(isResolved);
  const { data: plansData } = usePlans();
  const portal = useOpenBillingPortal();

  const [interval, setInterval] = useState<BillingInterval>('month');

  const proPrices = plansData?.plans.find((plan) => plan.id === 'pro')?.prices ?? [];
  const trialDays = plansData?.trialPeriodDays ?? 0;
  const role = useAuthStore((state) => state.user?.role);

  // Verification gates the purchase itself, so a blocked user gets a disabled
  // button and a route to the fix — not a live button that 403s.
  const blockedReason = !isPro ? (subscription?.subscribeBlockedReason ?? null) : null;
  const notice =
    !isPro && (blockedReason || (trialDays > 0 && subscription?.trialEligible === false))
      ? describeTrialIneligibility(blockedReason ?? subscription?.trialIneligibleReason, role)
      : null;
  const trialOffered = !isPro && trialDays > 0 && subscription?.trialEligible === true;
  const saving = computeAnnualSaving(proPrices);
  const showToggle = !isPro && !isAdmin && proPrices.length > 1;

  // Returning from the Stripe portal lands back here, so re-read the plan
  // rather than trusting whatever was cached before the user left.
  useEffect(() => {
    void refreshPlan();
  }, [refreshPlan]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5" aria-hidden="true" />
            Plan &amp; billing
          </CardTitle>
          <CardDescription>
            Manage your subscription, payment method and invoices.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isResolved || isLoading ? (
            <Skeleton className="h-16 w-full rounded-lg" />
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Current plan</span>
                  <Badge variant={isPro ? 'default' : 'secondary'}>{isPro ? 'Pro' : 'Free'}</Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  {isAdmin
                    ? 'Admin accounts have full access without a subscription.'
                    : renewalLine(subscription)}
                </p>
              </div>

              {!isAdmin && (
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  {subscription?.manageable && (
                    <Button
                      type="button"
                      variant="outline"
                      loading={portal.isPending}
                      loadingText="Opening…"
                      onClick={() => portal.mutate()}
                    >
                      Manage billing
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </Button>
                  )}
                  {!isPro && (
                    <UpgradeButton
                      source="settings"
                      interval={interval}
                      blockedReason={
                        blockedReason === 'email_unverified'
                          ? 'Verify your email address first.'
                          : blockedReason === 'kyc_unverified'
                            ? 'Complete identity verification first.'
                            : null
                      }
                      {...(trialOffered ? { label: `Start ${trialDays}-day free trial` } : {})}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {showToggle && (
            <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Billing interval</p>
                <p className="text-sm text-muted-foreground">
                  {priceLabel(findPrice(proPrices, interval)) ?? 'Price unavailable'}
                  {interval === 'year' && saving
                    ? ` — saves ${formatPrice(saving.amount, saving.currency)} a year`
                    : ''}
                </p>
              </div>
              <IntervalToggle
                value={interval}
                onChange={setInterval}
                savingLabel={saving ? `Save ${saving.percent}%` : null}
              />
            </div>
          )}

          {notice && (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground">{notice.message}</p>
              {notice.actionHref && (
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link href={notice.actionHref}>{notice.actionLabel}</Link>
                </Button>
              )}
            </div>
          )}

          {subscription?.status === 'past_due' && (
            <div className="rounded-lg border border-border bg-warning-subtle p-3 text-sm text-warning">
              Your last payment failed. Update your payment method to keep Pro — we&apos;ll keep
              retrying in the meantime.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What&apos;s included</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanComparison />
        </CardContent>
      </Card>
    </div>
  );
}

/** One line describing where the subscription stands right now. */
function renewalLine(
  subscription:
    | { cancelAtPeriodEnd: boolean; currentPeriodEnd: string | null; isPro: boolean; status: string }
    | undefined,
): string {
  if (!subscription || !subscription.isPro) {
    return 'Upgrade to unlock AI matching, AI proposals, your analytics and priority matching.';
  }

  if (!subscription.currentPeriodEnd) return 'Your Pro subscription is active.';

  const date = formatDate(subscription.currentPeriodEnd);

  if (subscription.cancelAtPeriodEnd) {
    return `Cancels on ${date} — you keep Pro until then.`;
  }

  // A trial is not a renewal: saying "Renews on" would imply the user has
  // already paid once, when this is the date of their FIRST charge.
  if (subscription.status === 'trialing') {
    return `Free trial — your first payment is on ${date}.`;
  }

  return `Renews on ${date}.`;
}
