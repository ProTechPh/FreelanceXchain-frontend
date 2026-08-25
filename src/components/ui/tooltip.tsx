"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider
const TooltipRoot = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

function TooltipContent({
  className,
  sideOffset = 6,
  side,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Popup> & {
  sideOffset?: number
  side?: React.ComponentProps<typeof TooltipPrimitive.Positioner>["side"]
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner side={side} sideOffset={sideOffset}>
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 max-w-64 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-md",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

/**
 * Convenience wrapper for the common case.
 *
 * A tooltip is supplementary only — WCAG 2.2 requires that it is reachable by
 * keyboard and never the sole carrier of meaning. Where a control has no visible
 * text (an icon button, a collapsed nav item), give it an `aria-label` as well;
 * the tooltip is for sighted pointer users, the label is for everyone else.
 */
function Tooltip({
  content,
  children,
  side,
  ...props
}: {
  content: React.ReactNode
  children: React.ReactNode
  side?: React.ComponentProps<typeof TooltipPrimitive.Positioner>["side"]
} & Omit<React.ComponentProps<typeof TooltipPrimitive.Root>, "children">) {
  if (!content) return <>{children}</>

  // base-ui merges the trigger's props into whatever `render` returns, so it must
  // be a single element that accepts DOM props — a Fragment silently drops them
  // (React warns about onPointerDown) and the tooltip never opens. Anything that
  // is not a single element gets wrapped in a span that can receive them.
  const trigger = React.isValidElement(children) ? (
    (children as React.ReactElement)
  ) : (
    <span className="inline-flex">{children}</span>
  )

  return (
    <TooltipRoot {...props}>
      <TooltipTrigger render={trigger} />
      <TooltipContent side={side}>{content}</TooltipContent>
    </TooltipRoot>
  )
}

export { Tooltip, TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent }
