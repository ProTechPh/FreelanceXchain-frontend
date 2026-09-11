'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { usePlan } from '@/hooks/use-plan';
import { ProLockPanel, type ProLockVariant } from '@/components/billing/pro-lock-panel';
import type { ProFeature } from '@/lib/plan-features';

interface ProGateProps {
  /** Which feature is locked; selects the copy. */
  feature: ProFeature;
  /** The real feature. Rendered untouched, with no wrapper, when entitled. */
  children: React.ReactNode;
  /**
   * page   - full-width panel for a whole route
   * card   - fills a CardContent on an otherwise-free page
   * inline - compact, fits inside a stat tile
   */
  variant?: ProLockVariant;
  className?: string;
}

/**
 * Renders a Pro feature, or a lock panel for users without it.
 *
 * IMPORTANT — this gate is only half the job. It controls RENDERING; it cannot
 * stop a request, because most of these pages fetch in an effect. Every gated
 * fetch must ALSO be disabled (`enabled: isPro` for React Query, an early
 * `if (!isPro) return;` in an effect). Without that the user sees the lock and
 * the API still eats a 403 on every mount.
 *
 * Admins are never shown a lock — see hasProAccess, which usePlan wraps.
 */
export function ProGate({ feature, children, variant = 'card', className }: ProGateProps) {
  const { isPro, isResolved } = usePlan();

  // Until the session is confirmed against the server, the plan is only a hint
  // from localStorage. Show a skeleton, never a lock: flashing a paywall at a
  // paying customer is worse than a moment of loading.
  if (!isResolved) {
    return (
      <Skeleton
        className={cn(
          variant === 'page' ? 'h-64 w-full' : variant === 'card' ? 'h-40 w-full' : 'h-7 w-24',
          className,
        )}
      />
    );
  }

  // No wrapper element on the entitled path, so layout, data-tour anchors and
  // e2e selectors are byte-identical to what they were before gating.
  if (isPro) return <>{children}</>;

  return <ProLockPanel feature={feature} variant={variant} className={className} />;
}
