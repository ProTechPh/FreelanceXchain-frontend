import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Semantic data table.
 *
 * The dashboards previously hand-rolled every table as nested divs, which is why
 * the freelancer and employer sides drifted apart and why none of them were
 * announced as tables. This uses real table semantics and scrolls horizontally
 * inside its own container so the page body never scrolls sideways.
 */
function Table({ className, containerClassName, ...props }: React.ComponentProps<"table"> & { containerClassName?: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [isScrollable, setIsScrollable] = React.useState(false)

  // On a phone a wide table scrolls silently -- there is no scrollbar to hint
  // that columns exist off to the right. Measure it and say so.
  React.useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const measure = () => setIsScrollable(node.scrollWidth > node.clientWidth + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        data-slot="table-container"
        className={cn("relative w-full overflow-x-auto", containerClassName)}
      >
        <table
          data-slot="table"
          className={cn("w-full caption-bottom border-collapse text-sm", className)}
          {...props}
        />
      </div>
      {isScrollable && (
        <p aria-hidden="true" className="mt-2 text-2xs text-muted-foreground sm:hidden">
          Swipe the table sideways for more columns
        </p>
      )}
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b [&_tr]:border-border", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("border-t border-border bg-muted/50 font-medium", className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border transition-colors duration-fast",
        "hover:bg-muted/60 data-[state=selected]:bg-accent",
        // Rows are made interactive by adding tabIndex; keep them focusable-safe.
        "focus-visible:bg-accent",
        className,
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      scope="col"
      className={cn(
        "h-10 px-3 text-left align-middle text-xs font-semibold tracking-wide text-muted-foreground uppercase",
        "whitespace-nowrap [&:has([role=checkbox])]:w-px",
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-3 py-3 align-middle text-sm", className)}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-3 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
}
