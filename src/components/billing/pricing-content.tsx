'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlanComparison } from '@/components/billing/plan-comparison';
import { UpgradeButton } from '@/components/billing/upgrade-button';
import { usePlan } from '@/hooks/use-plan';
import { useAuthStore } from '@/stores/authStore';

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
  'Priority matching',
];

export function PricingContent() {
  const { isPro, isResolved } = usePlan();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.user?.role);

  return (
    <div className="space-y-10">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl">Free</CardTitle>
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
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">Pro</CardTitle>
              <Badge>Monthly</Badge>
            </div>
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
              <UpgradeButton source="pricing" />
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
