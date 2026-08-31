'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * Root error boundary.
 *
 * The message is deliberately generic: `error.message` from a server component
 * is redacted in production anyway, and surfacing raw errors on a platform that
 * moves money invites people to act on noise. The digest is shown so support can
 * correlate a report with the server log.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[route error]', error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-(--space-page-x) py-16">
      <div className="w-full max-w-lg">
        <EmptyState
          icon={AlertTriangle}
          title="Something went wrong"
          description="We hit an unexpected error loading this page. Your account and any in-progress contracts are unaffected."
          action={<Button onClick={reset}>Try again</Button>}
          secondaryAction={
            <Button variant="outline" asChild>
              <Link href="/">Go to the homepage</Link>
            </Button>
          }
        />
        {error.digest && (
          <p className="mt-4 text-center text-2xs text-muted-foreground">
            Reference: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </main>
  );
}
