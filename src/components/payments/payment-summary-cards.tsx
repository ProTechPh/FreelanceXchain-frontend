'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatsSkeleton } from '@/components/dashboard/skeletons';
import { usePaymentSummary } from '@/hooks/use-payments';
import { formatAmount } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * The summary endpoint carries no currency field, but every payment record is
 * written with a hardcoded 'ETH' (api src/utils/payment-records.ts) and these
 * totals are sums of those records — formatting them as USD would misstate them.
 */
const LEDGER_CURRENCY = 'ETH';

/**
 * Lifetime earned/spent from `GET /payments/summary`.
 *
 * The endpoint returns `available: false` (and null totals) when a totals query
 * failed. That flag exists precisely so the UI can say "unavailable" rather than
 * render a confident 0 that reads as "you have earned nothing" — so a null total
 * must never fall back to zero here.
 *
 * The API caches these totals for 60s per user with no invalidation hook, so they
 * can lag a just-completed payment. Do not label them as live.
 */
export function PaymentSummaryCards({
  show = 'both',
  className,
}: {
  show?: 'both' | 'earnings' | 'spending';
  className?: string;
}) {
  const { data, isPending, isError } = usePaymentSummary();

  if (isPending) {
    return <StatsSkeleton tiles={show === 'both' ? 2 : 1} label="Loading payment summary" />;
  }

  const unavailable = isError || data?.available === false;

  const tiles = [
    {
      key: 'earnings',
      label: 'Lifetime earned',
      value: data?.totalEarnings ?? null,
      icon: TrendingUp,
      tone: 'text-success',
      bg: 'bg-success-subtle',
    },
    {
      key: 'spending',
      label: 'Lifetime spent',
      value: data?.totalSpent ?? null,
      icon: TrendingDown,
      tone: 'text-primary',
      bg: 'bg-primary/10',
    },
  ].filter((tile) => show === 'both' || tile.key === show);

  return (
    <div className={cn('grid gap-4', tiles.length > 1 ? 'sm:grid-cols-2' : '', className)}>
      {tiles.map((tile) => {
        const missing = unavailable || tile.value == null;
        return (
          <Card key={tile.key} data-slot="payment-summary-tile" className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{tile.label}</p>
                  <p
                    className={cn(
                      'mt-1 text-2xl font-bold tabular-nums',
                      missing && 'text-muted-foreground',
                    )}
                  >
                    {missing ? 'Unavailable' : formatAmount(tile.value, { currency: LEDGER_CURRENCY, fractionDigits: 4 })}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {missing
                      ? 'Totals could not be calculated right now. Try again shortly.'
                      : 'Completed payments only. Updates within a minute.'}
                  </p>
                </div>
                <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', tile.bg)}>
                  <tile.icon aria-hidden="true" className={cn('size-5', tile.tone)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
