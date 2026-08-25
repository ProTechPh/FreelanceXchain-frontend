"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

/**
 * Binary setting that applies immediately.
 *
 * Use a Checkbox instead when the change only takes effect on submit — a switch
 * that needs a Save button misleads.
 */
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent p-0.5",
        "transition-colors duration-fast ease-out outline-none",
        "bg-neutral-border",
        "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "data-checked:bg-primary",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-background shadow-xs",
          "transition-transform duration-fast ease-out",
          "data-checked:translate-x-4",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
