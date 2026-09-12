'use client';

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStartCheckout } from '@/hooks/use-plan';
import type { ProFeature } from '@/lib/plan-features';
import type { BillingInterval } from '@/types';

interface UpgradeButtonProps {
  /** Where the click came from, for the copy and for future attribution. */
  source: ProFeature | 'pricing' | 'settings' | 'nav';
  size?: 'xs' | 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'gradient';
  label?: string;
  className?: string;
  /** Which billing variant to buy. Defaults to monthly. */
  interval?: BillingInterval;
}

/**
 * The only component that starts a Checkout Session.
 *
 * Keeping it single-sourced means the loading state, the redirect validation
 * and the failure copy are written once rather than at every lock panel.
 */
export function UpgradeButton({
  source,
  size = 'default',
  variant = 'gradient',
  label = 'Upgrade to Pro',
  className,
  interval = 'month',
}: UpgradeButtonProps) {
  const checkout = useStartCheckout();

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      loading={checkout.isPending}
      loadingText="Opening checkout…"
      onClick={() => checkout.mutate(interval)}
      data-upgrade-source={source}
    >
      <Sparkles className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
