import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Shared loading shapes for dashboard pages.
 *
 * A centred spinner tells the user something is stuck; an outline of the content
 * that is about to arrive tells them it is on its way, and stops the layout
 * jumping when it lands. These mirror the four page shapes the dashboard
 * actually uses, so a page picks one rather than hand-rolling a spinner.
 *
 * Each sets `role="status"` with a screen-reader label, because a skeleton is
 * purely visual — `Skeleton` itself is `aria-hidden`.
 */

function Frame({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Rows of records: proposals, contracts, transactions, disputes, notifications. */
export function ListSkeleton({
  rows = 4,
  label = 'Loading results',
  className,
}: {
  rows?: number;
  label?: string;
  className?: string;
}) {
  return (
    <Frame label={label} className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border bg-card p-4">
          <div className="flex gap-3">
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-4/5" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
          </div>
        </div>
      ))}
    </Frame>
  );
}

/** KPI tiles above a content block: role dashboards, reputation, analytics. */
export function StatsSkeleton({
  tiles = 4,
  label = 'Loading dashboard',
  className,
}: {
  tiles?: number;
  label?: string;
  className?: string;
}) {
  return (
    <Frame label={label} className={cn('space-y-6', className)}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: tiles }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-border bg-card p-5">
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </Frame>
  );
}

/** A single record: contract, proposal, transaction, dispute detail. */
export function DetailSkeleton({
  label = 'Loading details',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <Frame label={label} className={cn('space-y-6', className)}>
      <div className="space-y-2">
        <Skeleton className="h-7 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Skeleton className="h-80 rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </Frame>
  );
}

/** Card grid: portfolio, recommendations, freelancer results. */
export function CardGridSkeleton({
  count = 6,
  className,
  label = 'Loading',
}: {
  count?: number;
  className?: string;
  label?: string;
}) {
  return (
    <Frame label={label} className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-52 rounded-xl" />
      ))}
    </Frame>
  );
}
