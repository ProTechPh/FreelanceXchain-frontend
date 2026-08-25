"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "@base-ui/react/progress"

import { cn } from "@/lib/utils"
import { type StatusTone } from "@/lib/status-styles"

const TONE_FILL: Record<StatusTone | "primary", string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  destructive: "bg-destructive",
  neutral: "bg-neutral",
}

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  tone?: StatusTone | "primary"
  /** Accessible name. Required — a bare bar tells a screen reader nothing. */
  label: string
  /** Render the percentage beside the bar. */
  showValue?: boolean
  size?: "sm" | "default"
}

/**
 * Milestone, funding and completion progress.
 *
 * Progress on this platform usually means money released, so the value is always
 * exposed to assistive tech via the primitive's ARIA wiring, never conveyed by
 * bar length alone.
 */
function Progress({
  className,
  value,
  tone = "primary",
  label,
  showValue = false,
  size = "default",
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn("flex w-full items-center gap-3", className)}
      {...props}
    >
      <ProgressPrimitive.Label className="sr-only">{label}</ProgressPrimitive.Label>
      <ProgressPrimitive.Track
        className={cn(
          "relative w-full flex-1 overflow-hidden rounded-full bg-muted",
          size === "sm" ? "h-1.5" : "h-2",
        )}
      >
        <ProgressPrimitive.Indicator
          className={cn("h-full rounded-full transition-[width] duration-slow ease-out", TONE_FILL[tone])}
        />
      </ProgressPrimitive.Track>
      {showValue && (
        <ProgressPrimitive.Value className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground" />
      )}
    </ProgressPrimitive.Root>
  )
}

export { Progress }
