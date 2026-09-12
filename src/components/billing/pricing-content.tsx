'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanComparison } from '@/components/billing/plan-comparison';
import { UpgradeButton } from '@/components/billing/upgrade-button';
import { IntervalToggle } from '@/components/billing/interval-toggle';
import { usePlan, usePlans } from '@/hooks/use-plan';
import { useAuthStore } from '@/stores/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  computeAnnualSaving,
  findPrice,
  formatPrice,
  monthlyEquivalent,
} from '@/lib/plan-pricing';
import type { BillingInterval } from '@/types';

const FREE_HIGHLIGHTS = [
  'Browse, search and post projects',
  'Proposals, contracts and messaging',
  'Smart-contract escrow and milestones',
  'Reputation, reviews and KYC',
];

const PRO_HIGHLIGHTS = [
  'AI project and candidate recommendations',
  'Draft proposals with AI',
  'Skill gap analysis and demand trends',
  'Your earnings and spend analytics',
  'Priority matching — matched to new projects first',
];

export function PricingContent() {
  const { isPro, isResolved } = usePlan();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.user?.role);
  const { data: plansData, isLoading: pricesLoading } = usePlans();

  const [interval, setInterval] = useState<BillingInterval>('month');

  const proPrices = plansData?.plans.find((plan) => plan.id === 'pro')?.prices ?? [];
  const trialDays = plansData?.trialPeriodDays ?? 0;
  const saving = computeAnnualSaving(proPrices);
  const selectedPrice = findPrice(proPrices, interval);
  const annualPrice = findPrice(proPrices, 'year');
  const hasAnnual = Boolean(annualPrice);
  // Only offer the switch when there is genuinely something to switch to.
  const showToggle = hasAnnual && proPrices.length > 1;

  return (
    <div className="space-y-10">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader className="space-y-3">
            <CardTitle className="text-xl">Free</CardTitle>
            <p className="text-3xl font-extrabold text-foreground">
              $0<span className="text-base font-medium text-muted-foreground"> / forever</span>
            </p>
            <CardDescription>Everything you need to work and get paid.</CardDescription>
          </CardHeader>
          <CardContent className="flex grow flex-col gap-4">
            <ul className="grow space-y-2">
              {FREE_HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            {!isAuthenticated && (
              <Button asChild variant="outline">
                <Link href="/register">Create a free account</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col border-primary/30">
          <CardHeader className="space-y-3">
            {/* The saving is stated once, inside the toggle where the choice is
                actually made. A second badge up here said the same thing twice. */}
            <CardTitle className="text-xl">Pro</CardTitle>

            {showToggle && (
              <IntervalToggle
                value={interval}
                onChange={setInterval}
                savingLabel={saving ? `Save ${saving.percent}%` : null}
              />
            )}

            {pricesLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div>
                {/* Amount and interval carry different weight on purpose: set at
                    one size they competed, and the figure is what people scan. */}
                <p className="text-foreground">
                  <span className="text-3xl font-extrabold tracking-tight">
                    {formatPrice(selectedPrice?.unitAmount ?? null, selectedPrice?.currency ?? null) ?? 'Contact us'}
                  </span>
                  {selectedPrice && (
                    <span className="ml-1 text-base font-medium text-muted-foreground">
                      / {selectedPrice.interval}
                    </span>
                  )}
                </p>
                {interval === 'year' && monthlyEquivalent(annualPrice) && (
                  <p className="text-sm text-muted-foreground">
                    {monthlyEquivalent(annualPrice)} / month, billed yearly
                    {saving ? ` — saves ${formatPrice(saving.amount, saving.currency)} a year` : ''}
                  </p>
                )}
                {trialDays > 0 && (
                  <p className="text-sm font-medium text-success">
                    {trialDays} days free, then billed {interval === 'year' ? 'yearly' : 'monthly'}
                  </p>
                )}
              </div>
            )}

            <CardDescription>
              Everything in Free, plus the AI matching and analytics layer.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex grow flex-col gap-4">
            <ul className="grow space-y-2">
              {PRO_HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            {/* Nothing is rendered until the session resolves, so a Pro user
                never sees "Upgrade" flash on their own pricing page. */}
            {!isResolved ? null : !isAuthenticated ? (
              <Button asChild variant="gradient">
                <Link href="/register">Get started</Link>
              </Button>
            ) : isPro ? (
              <Button asChild variant="outline">
                <Link href={`/dashboard/${role ?? 'freelancer'}/billing`}>Manage your plan</Link>
              </Button>
            ) : (
              <UpgradeButton
                source="pricing"
                interval={interval}
                {...(trialDays > 0 ? { label: `Start ${trialDays}-day free trial` } : {})}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-bold text-foreground">Compare plans</h2>
        <PlanComparison />
      </div>
    </div>
  );
}
