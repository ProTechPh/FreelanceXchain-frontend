"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from 'lucide-react'

import { cn } from "@/lib/utils"

// Reference implementation for the state contract in skill.md: every component
// must define default, hover, focus-visible, active, disabled, loading and error.
//
// Notes on the choices here:
//  - `disabled` uses explicit muted tokens rather than opacity. Fading a button
//    to 50% drags its text below the AA threshold; muted tokens stay legible
//    while still reading as unavailable.
//  - `active:` states are real, not inherited from hover.
//  - `loading` is a prop, not a caller-assembled spinner. 36 files were building
//    their own; this makes the state consistent and keeps `aria-busy` attached.
//  - A loading button keeps its normal colour. It is still `disabled` so it
//    cannot be submitted twice, but the muted disabled treatment reads as
//    "unavailable" when the truth is "working" — hence the not-data-[loading]
//    guards on the disabled styles below.
const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md font-semibold",
    "transition-[background-color,border-color,color,box-shadow,transform]",
    "duration-fast ease-out",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:cursor-not-allowed",
    "aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed",
    "data-[loading=true]:cursor-progress data-[loading=true]:opacity-100",
    // Error state, driven by aria-invalid so form libraries wire it for free.
    "aria-invalid:ring-2 aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground shadow-xs",
          "hover:bg-primary-hover",
          "active:bg-primary-active",
          "not-data-[loading=true]:disabled:bg-muted not-data-[loading=true]:disabled:text-muted-foreground not-data-[loading=true]:disabled:shadow-none",
          "aria-not-data-[loading=true]:disabled:bg-muted aria-not-data-[loading=true]:disabled:text-muted-foreground",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground shadow-xs",
          "hover:bg-destructive/90",
          "active:bg-destructive/80",
          "focus-visible:ring-destructive",
          "not-data-[loading=true]:disabled:bg-muted not-data-[loading=true]:disabled:text-muted-foreground not-data-[loading=true]:disabled:shadow-none",
        ].join(" "),
        outline: [
          "border border-input bg-transparent text-foreground",
          "hover:bg-accent hover:text-accent-foreground hover:border-primary",
          "active:bg-primary-subtle",
          "not-data-[loading=true]:disabled:border-border not-data-[loading=true]:disabled:text-muted-foreground",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/70",
          "active:bg-secondary/90",
          "not-data-[loading=true]:disabled:bg-muted not-data-[loading=true]:disabled:text-muted-foreground",
        ].join(" "),
        ghost: [
          "bg-transparent text-foreground",
          "hover:bg-accent hover:text-accent-foreground",
          "active:bg-primary-subtle",
          "not-data-[loading=true]:disabled:text-muted-foreground",
        ].join(" "),
        link: [
          "text-primary underline-offset-4",
          "hover:underline",
          "active:text-primary-active",
          "not-data-[loading=true]:disabled:text-muted-foreground not-data-[loading=true]:disabled:no-underline",
        ].join(" "),
        // Kept because 27 call sites use it. It now resolves against a real
        // utility — previously `gradient-primary` was undefined, so this variant
        // rendered as white text on no background.
        gradient: [
          "gradient-primary text-primary-foreground shadow-sm",
          "hover:opacity-90",
          "active:opacity-100 active:brightness-95",
          "not-data-[loading=true]:disabled:bg-none not-data-[loading=true]:disabled:bg-muted not-data-[loading=true]:disabled:text-muted-foreground not-data-[loading=true]:disabled:shadow-none",
        ].join(" "),
      },
      size: {
        xs: "h-7 gap-1.5 px-2 text-2xs",
        sm: "h-9 px-3 text-sm",
        default: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-xs": "size-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Shows a spinner, disables interaction and sets aria-busy. */
  loading?: boolean
  /** Announced while loading. Defaults to the button's own content. */
  loadingText?: string
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  // `asChild` renders an arbitrary element (usually a Link); injecting a spinner
  // there would break Slot's single-child contract, so loading only decorates
  // real buttons.
  const showSpinner = loading && !asChild
  const iconOnly = size === "icon" || size === "icon-sm" || size === "icon-xs"

  return (
    <Comp
      data-slot="button"
      data-loading={loading || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {showSpinner ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {loadingText ?? (iconOnly ? null : children)}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants, type ButtonProps }
