import * as React from "react"

import { cn } from "@/lib/utils"

interface EmptyStateProps extends React.ComponentProps<"div"> {
  /** Lucide icon component. Decorative — the title carries the meaning. */
  icon?: React.ElementType
  title: string
  description?: React.ReactNode
  /** Primary action. Keep it to one; a second choice belongs in `secondaryAction`. */
  action?: React.ReactNode
  secondaryAction?: React.ReactNode
  size?: "sm" | "default"
}

/**
 * The one empty state. Every list, table and search result uses it so "nothing
 * here" always looks deliberate rather than broken.
 *
 * Copy rule (SKILL.md tone): say what is missing and what to do about it. Never
 * a bare "No data".
 */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  size = "default",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border text-center",
        size === "sm" ? "gap-2 px-4 py-8" : "gap-3 px-6 py-14",
        className,
      )}
      {...props}
    >
      {Icon && (
        <div
          aria-hidden="true"
          className={cn(
            "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
            size === "sm" ? "size-9" : "size-12",
          )}
        >
          <Icon className={size === "sm" ? "size-4" : "size-5"} />
        </div>
      )}
      <p className={cn("font-semibold text-foreground", size === "sm" ? "text-sm" : "text-base")}>
        {title}
      </p>
      {description && (
        <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}

export { EmptyState }
