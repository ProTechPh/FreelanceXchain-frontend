import Link from 'next/link';
import { Compass } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-(--space-page-x) py-16">
      <div className="w-full max-w-lg">
        <p className="mb-3 text-center text-sm font-semibold text-muted-foreground">404</p>
        <EmptyState
          icon={Compass}
          title="We couldn't find that page"
          description="The link may be out of date, or the project, contract or profile it pointed to may no longer be available."
          action={
            <Button asChild>
              <Link href="/">Go to the homepage</Link>
            </Button>
          }
          secondaryAction={
            <Button asChild variant="outline">
              <Link href="/projects">Browse projects</Link>
            </Button>
          }
        />
      </div>
    </main>
  );
}
