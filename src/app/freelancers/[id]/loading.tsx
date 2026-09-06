import { Skeleton } from '@/components/ui/skeleton';

export default function FreelancerDetailLoading() {
  return (
    <div role="status" aria-live="polite" className="min-h-screen bg-background">
      <span className="sr-only">Loading freelancer profile…</span>
      <div className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
      <div className="pt-28 sm:pt-36 pb-20 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-start gap-6">
          <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 max-w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
