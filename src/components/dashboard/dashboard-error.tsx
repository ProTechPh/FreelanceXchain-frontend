'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * Dashboard segment error boundary.
 *
 * Without this, a thrown page fell through to the root boundary, which renders
 * outside `DashboardLayout` — so the sidebar and top bar disappeared and the only
 * way out was a link to the marketing homepage. Scoping the boundary here keeps
 * the shell mounted, so one failing panel never strands someone mid-contract.
 */
export function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md">
        <EmptyState
          icon={AlertTriangle}
          title="This page didn't load"
          description="Something went wrong fetching your data. Your contracts, milestones and escrow balances are unaffected — nothing was changed."
          action={<Button onClick={reset}>Try again</Button>}
        />
        {error.digest && (
          <p className="mt-4 text-center text-2xs text-muted-foreground">
            Reference: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  );
}
