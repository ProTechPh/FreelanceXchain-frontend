"use client"

import * as React from "react"
import { Popover } from "@base-ui/react/popover"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { useField } from "@/components/ui/field"
import {
  MONTH_LABELS,
  addDaysToDateValue,
  calendarWeeks,
  dayOptions,
  formatDateValue,
  isCompleteDateValue,
  monthOptions,
  splitDateValue,
  yearOptions,
} from "@/lib/date-select"

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

interface DatePickerProps {
  /** Names the picker for assistive tech, e.g. "Start date". */
  label: string
  /** YYYY-MM-DD, or '' when nothing is picked. */
  value: string
  onChange: (value: string) => void
  /** Earliest and latest selectable dates (YYYY-MM-DD). */
  min: string
  max: string
  placeholder?: string
}

type View = { year: number; month: number }

const pad = (n: number) => String(n).padStart(2, "0")
const yearMonth = ({ year, month }: View) => `${year}-${pad(month)}`

/** The month to show when opening: the picked date's month, kept inside the allowed range. */
function initialView(value: string, min: string, max: string): View {
  const source = isCompleteDateValue(value) ? value : max
  const clamped = source < min ? min : source > max ? max : source
  const { year, month } = splitDateValue(clamped)
  return { year: Number(year), month: Number(month) }
}

function shiftMonth({ year, month }: View, delta: number): View {
  const index = year * 12 + (month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

/** Today in the viewer's own time zone, as YYYY-MM-DD. */
function localToday(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function longDate(value: string): string {
  const { year, month, day } = splitDateValue(value)
  const weekday = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay()
  return `${WEEKDAY_NAMES[weekday]}, ${MONTH_NAMES[Number(month) - 1]} ${Number(day)}, ${year}`
}

/**
 * Calendar date picker that only lets dates between `min` and `max` be picked:
 * days, months and years outside the range are disabled, and the arrows stop
 * at its ends. A stored value outside the range (saved before this check
 * existed) is still shown on the button, so the Field's error explains it.
 * Must be rendered inside a <Field>.
 */
function DatePicker({ label, value, onChange, min, max, placeholder = "Pick a date" }: DatePickerProps) {
  const field = useField()
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState<View>(() => initialView(value, min, max))
  // Day to focus after an arrow key moves to it (possibly in another month).
  const pendingFocusRef = React.useRef<string | null>(null)
  const gridRef = React.useRef<HTMLDivElement>(null)
  const focusTargetRef = React.useRef<HTMLButtonElement>(null)

  const hasRange = min <= max
  const today = localToday()
  const allowedDays = dayOptions(String(view.year), pad(view.month), min, max)
  const isAllowed = (date: string) => date >= min && date <= max
  const canGoBack = hasRange && yearMonth(shiftMonth(view, -1)) >= min.slice(0, 7)
  const canGoForward = hasRange && yearMonth(shiftMonth(view, 1)) <= max.slice(0, 7)

  // Roving focus: one day in the grid is tabbable — the picked day, else today, else the first allowed day.
  const viewPrefix = `${yearMonth(view)}-`
  const focusTarget =
    (isCompleteDateValue(value) && value.startsWith(viewPrefix) && isAllowed(value) && value) ||
    (today.startsWith(viewPrefix) && today) ||
    (allowedDays[0] ? `${viewPrefix}${allowedDays[0]}` : null)

  React.useEffect(() => {
    const date = pendingFocusRef.current
    if (!date) return
    pendingFocusRef.current = null
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)?.focus()
  }, [view])

  const handleOpenChange = (next: boolean) => {
    if (next) setView(initialView(value, min, max))
    setOpen(next)
  }

  const pick = (date: string) => {
    onChange(date)
    setOpen(false)
  }

  const changeYear = (year: number) => {
    const allowed = monthOptions(String(year), min, max).map(Number)
    const month = allowed.includes(view.month)
      ? view.month
      : allowed.reduce((best, m) => (Math.abs(m - view.month) < Math.abs(best - view.month) ? m : best), allowed[0] ?? view.month)
    setView({ year, month })
  }

  const handleGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const current = (event.target as HTMLElement).dataset.date
    if (!current) return
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key]
    if (step === undefined) return
    event.preventDefault()
    const target = addDaysToDateValue(current, step)
    if (!isAllowed(target)) return
    const { year, month } = splitDateValue(target)
    pendingFocusRef.current = target
    // A new object even for the same month, so the effect above runs and moves focus.
    setView({ year: Number(year), month: Number(month) })
  }

  const shown = value ? (isCompleteDateValue(value) ? formatDateValue(value) : value) : ""

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger
        id={field.id}
        disabled={field.disabled || !hasRange}
        aria-label={`${label}, ${shown || "not set"}`}
        aria-invalid={field["aria-invalid"]}
        aria-describedby={field["aria-describedby"]}
        className={cn(
          "flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm text-foreground",
          "transition-[border-color,box-shadow] duration-fast ease-out outline-none",
          "hover:border-foreground/30 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground",
          "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30",
        )}
      >
        <span className={cn("truncate tabular-nums", !shown && "text-muted-foreground")}>{shown || placeholder}</span>
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="start" className="z-[70]">
          <Popover.Popup
            initialFocus={focusTargetRef}
            aria-label={`Choose ${label.toLowerCase()}`}
            className={cn(
              "w-72 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            )}
          >
            <div className="mb-2 flex items-center gap-1">
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40"
                aria-label="Previous month"
                disabled={!canGoBack}
                onClick={() => setView((v) => shiftMonth(v, -1))}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <select
                aria-label="Month"
                className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-1.5 text-sm"
                value={view.month}
                onChange={(event) => setView((v) => ({ ...v, month: Number(event.target.value) }))}
              >
                {MONTH_LABELS.map((name, index) => (
                  <option key={name} value={index + 1} disabled={!monthOptions(String(view.year), min, max).includes(pad(index + 1))}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Year"
                className="h-8 w-20 rounded-md border border-input bg-background px-1.5 text-sm tabular-nums"
                value={view.year}
                onChange={(event) => changeYear(Number(event.target.value))}
              >
                {yearOptions(min, max).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40"
                aria-label="Next month"
                disabled={!canGoForward}
                onClick={() => setView((v) => shiftMonth(v, 1))}
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div role="grid" aria-label={`${MONTH_NAMES[view.month - 1]} ${view.year}`} ref={gridRef} onKeyDown={handleGridKeyDown}>
              <div role="row" className="grid grid-cols-7 text-center text-2xs font-medium text-muted-foreground">
                {WEEKDAYS.map((day, index) => (
                  <span key={day} role="columnheader" aria-label={WEEKDAY_NAMES[index]} className="py-1">
                    {day}
                  </span>
                ))}
              </div>
              {calendarWeeks(view.year, view.month).map((week, weekIndex) => (
                <div role="row" key={weekIndex} className="grid grid-cols-7">
                  {week.map((date, dayIndex) =>
                    date ? (
                      <span role="gridcell" key={date} className="flex items-center justify-center p-0.5">
                        <button
                          type="button"
                          ref={date === focusTarget ? focusTargetRef : undefined}
                          data-date={date}
                          tabIndex={date === focusTarget ? 0 : -1}
                          disabled={!isAllowed(date)}
                          aria-label={longDate(date)}
                          aria-pressed={date === value}
                          aria-current={date === today ? "date" : undefined}
                          onClick={() => pick(date)}
                          className={cn(
                            "inline-flex size-8 items-center justify-center rounded-md text-sm tabular-nums",
                            "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                            "disabled:pointer-events-none disabled:text-muted-foreground/40 disabled:line-through",
                            date === today && "font-semibold text-primary",
                            date === value && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                          )}
                        >
                          {Number(date.slice(8))}
                        </button>
                      </span>
                    ) : (
                      <span role="gridcell" key={`blank-${weekIndex}-${dayIndex}`} aria-hidden="true" />
                    ),
                  )}
                </div>
              ))}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

export { DatePicker }
