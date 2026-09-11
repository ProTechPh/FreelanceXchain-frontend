import * as React from "react"
import Link from "next/link"
import { ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

function Breadcrumb({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      className={cn("w-full", className)}
      {...props}
    />
  )
}

function BreadcrumbList({
  className,
  ...props
}: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "flex flex-wrap items-center gap-1.5 break-words text-xs sm:text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  )
}

function BreadcrumbLink({
  asChild,
  className,
  href,
  children,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
  href?: string
}) {
  const linkClasses = cn(
    "transition-colors hover:text-foreground text-muted-foreground font-medium",
    className
  )

  if (asChild) {
    return <>{children}</>
  }

  if (href) {
    return (
      <Link href={href} className={linkClasses} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <a href={href} className={linkClasses} {...props}>
      {children}
    </a>
  )
}

function BreadcrumbPage({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      role="link"
      aria-disabled="true"
      aria-current="page"
      data-slot="breadcrumb-page"
      className={cn("font-medium text-foreground truncate max-w-[200px] sm:max-w-[320px]", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      data-slot="breadcrumb-separator"
      className={cn("text-muted-foreground/60 shrink-0 [&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight className="size-3.5" />}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      data-slot="breadcrumb-ellipsis"
      className={cn("flex size-7 items-center justify-center text-muted-foreground", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
