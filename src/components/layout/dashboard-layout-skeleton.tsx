export function DashboardLayoutSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen bg-background"
    >
      <span className="sr-only">Loading your dashboard…</span>
      {/* Desktop Sidebar Skeleton */}
      <aside
        aria-hidden="true"
        className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex space-y-6"
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-2">
          <div className="size-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="h-9 w-full rounded-md bg-muted animate-pulse" />
          <div className="h-9 w-full rounded-md bg-muted animate-pulse" />
          <div className="h-9 w-full rounded-md bg-muted animate-pulse" />
          <div className="h-9 w-full rounded-md bg-muted animate-pulse" />
          <div className="h-9 w-full rounded-md bg-muted animate-pulse" />
        </div>
        <div className="border-t border-sidebar-border pt-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-muted animate-pulse" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-20 rounded bg-muted animate-pulse" />
              <div className="h-3 w-28 rounded bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </aside>

      {/* Content Area Skeleton */}
      <div aria-hidden="true" className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
          <div className="h-9 w-48 sm:w-72 rounded-md bg-muted animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-muted animate-pulse" />
            <div className="size-9 rounded-full bg-muted animate-pulse" />
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:px-(--space-page-x) space-y-6">
          <div className="space-y-2">
            <div className="h-8 w-48 rounded bg-muted animate-pulse" />
            <div className="h-4 w-72 rounded bg-muted animate-pulse" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-28 rounded-xl bg-muted animate-pulse" />
            <div className="h-28 rounded-xl bg-muted animate-pulse" />
            <div className="h-28 rounded-xl bg-muted animate-pulse" />
            <div className="h-28 rounded-xl bg-muted animate-pulse" />
          </div>
          <div className="h-72 rounded-xl bg-muted animate-pulse" />
        </main>
      </div>
    </div>
  );
}

export function DashboardRedirectSpinner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-background"
    >
      <span className="sr-only">Redirecting…</span>
      <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
