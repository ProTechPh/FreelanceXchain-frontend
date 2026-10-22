"use client"

import * as React from "react"

import { useField } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MONTH_LABELS,
  changeDatePart,
  dayOptions,
  joinDateParts,
  monthOptions,
  splitDateValue,
  yearOptions,
  type DatePart,
} from "@/lib/date-select"

interface DateSelectProps {
  /** Used to name each dropdown for assistive tech, e.g. "Start date year". */
  label: string
  /** YYYY-MM-DD, a partial value while choosing ('2024', '2024-05'), or ''. */
  value: string
  onChange: (value: string) => void
  /** Earliest and latest selectable dates (YYYY-MM-DD). */
  min: string
  max: string
}

/**
 * Year / Month / Day dropdowns that only list dates between `min` and `max`,
 * so a future or too-early date can't be picked at all. Month and day unlock
 * in order, because which ones are allowed depends on the year.
 *
 * A stored value outside the range (saved before this check existed) is still
 * shown, as a disabled option, so the Field's error explains what to fix.
 * Must be rendered inside a <Field>.
 */
function DateSelect({ label, value, onChange, min, max }: DateSelectProps) {
  const field = useField()
  const parts = splitDateValue(value)

  const withCurrent = (options: string[], current: string) =>
    current && !options.includes(current) ? [current, ...options] : options

  const allowedYears = yearOptions(min, max)
  const allowedMonths = monthOptions(parts.year, min, max)
  const allowedDays = dayOptions(parts.year, parts.month, min, max)

  const columns: { part: DatePart; placeholder: string; allowed: string[]; label: (option: string) => string }[] = [
    { part: "year", placeholder: "Year", allowed: allowedYears, label: (option) => option },
    {
      part: "month",
      placeholder: "Month",
      allowed: allowedMonths,
      label: (option) => MONTH_LABELS[Number(option) - 1] ?? option,
    },
    { part: "day", placeholder: "Day", allowed: allowedDays, label: (option) => String(Number(option)) },
  ]

  return (
    <div role="group" aria-label={label} className="grid grid-cols-[1.2fr_1fr_0.8fr] gap-2">
      {columns.map(({ part, placeholder, allowed, label: optionLabel }, index) => {
        const options = withCurrent(allowed, parts[part])
        const items = Object.fromEntries(options.map((option) => [option, optionLabel(option)]))
        // Month waits for a year, day waits for a month.
        const locked = index > 0 && !parts[columns[index - 1]!.part]
        return (
          <Select
            key={part}
            items={items}
            // null (not undefined) keeps the Select controlled before anything is picked.
            value={parts[part] || null}
            disabled={field.disabled || locked}
            onValueChange={(next) => {
              if (next) onChange(joinDateParts(changeDatePart(parts, part, next as string, min, max)))
            }}
          >
            <SelectTrigger
              id={index === 0 ? field.id : `${field.id}-${part}`}
              aria-label={`${label} ${part}`}
              aria-invalid={field["aria-invalid"]}
              aria-describedby={field["aria-describedby"]}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            {/* Open below the box: when only one option is allowed, an overlaid list looks like nothing opened. */}
            <SelectContent alignItemWithTrigger={false}>
              {options.map((option) => (
                <SelectItem key={option} value={option} disabled={!allowed.includes(option)}>
                  {optionLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      })}
    </div>
  )
}

export { DateSelect }
