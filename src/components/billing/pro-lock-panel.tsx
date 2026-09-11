'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UpgradeButton } from '@/components/billing/upgrade-button';
import { PRO_FEATURE_COPY, type ProFeature } from '@/lib/plan-features';

export type ProLockVariant = 'page' | 'card' | 'inline';

interface ProLockPanelProps {
  feature: ProFeature;
  variant?: ProLockVariant;
  className?: string;
}

/**
 * The locked state for a Pro feature.
 *
 * A solid surface, not a translucent scrim over live text: the product decision
 * is a hard block, so there is nothing behind it to see, and a blurred overlay
 * would fail contrast for real users even though the token checker only reads
 * class names.
 */
export function ProLockPanel({ feature, variant = 'card', className }: ProLockPanelProps) {
  const copy = PRO_FEATURE_COPY[feature];

  if (variant === 'inline') {
    return (
      <div
        role="region"
        aria-label="Pro feature"
        className={cn('flex items-center gap-2 py-1', className)}
      >
        <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">Pro feature</span>
        <UpgradeButton source={feature} size="xs" variant="link" label="Upgrade" />
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Pro feature"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted text-center',
        variant === 'page' ? 'px-6 py-12' : 'px-4 py-8',
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-primary-subtle">
        <Lock className="size-5 text-primary" aria-hidden="true" />
      </span>

      <div className="max-w-md space-y-1">
        <p className="font-semibold text-foreground">{copy.title}</p>
        <p className="text-sm text-muted-foreground">{copy.description}</p>
      </div>

      <div className="flex flex-col items-center gap-2 sm:flex-row">
        <UpgradeButton source={feature} size={variant === 'page' ? 'default' : 'sm'} />
        <Link
          href="/pricing"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Compare plans
        </Link>
      </div>
    </div>
  );
}
