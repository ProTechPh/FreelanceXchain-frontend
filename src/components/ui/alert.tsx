import * as React from "react"
import {
  AlertCircle,
  CircleCheck,
  Info,
  OctagonAlert,
  TriangleAlert,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { StatusTone } from "@/lib/status-styles"

/**
 * The one inline message banner.
 *
 * Before this existed the same banner was hand-rolled in eight places, each
 * with its own padding, icon and heading weight, and most reaching for
 * `bg-destructive/10` — an opacity guess — instead of the `-subtle` token that
 * `verify:contrast` actually checks. Colour alone never carries the meaning:
 * every tone ships an icon, and the title states the problem in words.
 *
 * For a message attached to a single form control use `Field`'s `error` prop
 * instead; this is for messages that belong to a whole form, page or section.
 */

type AlertTone = StatusTone

const TONE_CLASS: Record<AlertTone, string> = {
  success: "bg-success-subtle text-success border-success-border",
  warning: "bg-warning-subtle text-warning border-warning-border",
  info: "bg-info-subtle text-info border-info-border",
  destructive: "bg-destructive-subtle text-destructive border-destructive-border",
  neutral: "bg-neutral-subtle text-neutral border-neutral-border",
}

const TONE_ICON: Record<AlertTone, React.ElementType> = {
  success: CircleCheck,
  warning: TriangleAlert,
  info: Info,
  destructive: OctagonAlert,
  neutral: AlertCircle,
}

/**
 * `alert` interrupts a screen reader, which is right for a problem that just
 * appeared and wrong for a notice that was always on the page. Faults announce;
 * everything else is polite.
 */
const TONE_ROLE: Record<AlertTone, "alert" | "status"> = {
  success: "status",
  warning: "alert",
  info: "status",
  destructive: "alert",
  neutral: "status",
}

interface AlertProps extends Omit<React.ComponentProps<"div">, "title"> {
  tone?: AlertTone
  /** Sentence case, states the problem. Carries the meaning when colour cannot. */
  title: React.ReactNode
  description?: React.ReactNode
  /** One next step — a button or link. */
  action?: React.ReactNode
  /** Pass `false` for a banner that is always present, so it does not announce. */
  live?: boolean
  /** Replaces the tone's default icon. Decorative either way. */
  icon?: React.ElementType
}

function Alert({
  tone = "destructive",
  title,
  description,
  action,
  live,
  icon,
  className,
  children,
  ...props
}: AlertProps) {
  const Icon = icon ?? TONE_ICON[tone]
  const role = live === false ? undefined : TONE_ROLE[tone]

  return (
    <div
      data-slot="alert"
      data-tone={tone}
      role={role}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3.5 text-sm",
        TONE_CLASS[tone],
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="font-semibold">{title}</p>
        {description && (
          // Stays in the tone colour: `muted-foreground` on a tinted fill is not
          // one of the pairs `verify:contrast` checks.
          <p className="text-xs leading-relaxed break-words sm:text-sm">{description}</p>
        )}
        {children}
        {action && <div className="mt-1 flex flex-wrap items-center gap-2">{action}</div>}
      </div>
    </div>
  )
}

export { Alert, type AlertProps, type AlertTone }
