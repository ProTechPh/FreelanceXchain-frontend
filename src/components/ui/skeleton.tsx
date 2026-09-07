import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Loading placeholder. Held at `--muted` rather than a shimmer gradient so it
 * reads as absence rather than content, and it is hidden from assistive tech —
 * the surrounding region should carry `aria-busy` instead.
 *
 * The pulse is neutralized by the global reduced-motion rule.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return <Skeleton className={cn('h-32 w-full rounded-xl', className)} />
}

function SkeletonText({ className, lines = 1 }: { className?: string; lines?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full rounded" />
      ))}
    </div>
  )
}

function SkeletonAvatar({ className }: { className?: string }) {
  return <Skeleton className={cn('h-10 w-10 rounded-full', className)} />
}

export { Skeleton, SkeletonCard, SkeletonText, SkeletonAvatar }
