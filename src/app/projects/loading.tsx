import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectsLoading() {
  return (
    <div role="status" aria-live="polite" className="min-h-screen bg-background">
      <span className="sr-only">Loading projects…</span>
      {/* Navbar skeleton */}
      <div className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="pt-28 sm:pt-36 pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <Skeleton className="h-6 w-48 mb-3" />
        <Skeleton className="h-10 w-96 max-w-full mb-2" />
        <Skeleton className="h-5 w-80 max-w-full mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
