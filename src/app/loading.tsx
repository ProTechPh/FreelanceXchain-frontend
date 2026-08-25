import { Skeleton } from '@/components/ui/skeleton';

/**
 * Route-level loading fallback. Shown while a server component streams, so it
 * mirrors a generic page shell rather than a spinner — a stable outline reads as
 * "arriving", a spinner reads as "stuck".
 */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto w-full max-w-6xl px-(--space-page-x) py-10">
      <span className="sr-only">Loading page…</span>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
