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

/** Pre-composed text block: n lines with a short final line. */
function SkeletonText({
  lines = 3,
  className,
  ...props
}: React.ComponentProps<"div"> & { lines?: number }) {
  return (
    <div data-slot="skeleton-text" className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-4", index === lines - 1 && lines > 1 && "w-2/3")}
        />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonText }
