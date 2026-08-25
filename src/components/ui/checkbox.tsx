"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check, Minus } from 'lucide-react'

import { cn } from "@/lib/utils"

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // 16px box inside a 20px hit area keeps the visual light while staying
        // above the WCAG 2.2 minimum target size.
        "peer flex size-4 shrink-0 items-center justify-center rounded-sm border border-input bg-background text-primary-foreground",
        "transition-[background-color,border-color,box-shadow] duration-fast ease-out outline-none",
        "hover:border-foreground/40",
        "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring",
        "data-checked:border-primary data-checked:bg-primary",
        "data-indeterminate:border-primary data-indeterminate:bg-primary",
        "active:scale-95",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:data-checked:bg-muted-foreground",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className="flex items-center justify-center text-current"
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            {state.indeterminate ? (
              <Minus className="size-3" aria-hidden="true" />
            ) : (
              <Check className="size-3" aria-hidden="true" />
            )}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
