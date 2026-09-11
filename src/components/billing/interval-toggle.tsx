'use client';

import { cn } from '@/lib/utils';
import type { BillingInterval } from '@/types';

interface IntervalToggleProps {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  /** e.g. "Save 17%" — omitted when annual is not genuinely cheaper. */
  savingLabel?: string | null;
  className?: string;
}

/**
 * Monthly / annual switch.
 *
 * Two equal-width segments on a grid, not an inline row: with the saving badge
 * living inside the annual option, an auto-width row made that segment visibly
 * wider than the other, so the control read as lopsided rather than as one
 * choice with two sides.
 *
 * A radiogroup rather than two buttons, because this is one choice with two
 * states — assistive tech should announce it that way, and arrow-key movement
 * comes for free.
 */
export function IntervalToggle({ value, onChange, savingLabel, className }: IntervalToggleProps) {
  const options: Array<{ id: BillingInterval; label: string }> = [
    { id: 'month', label: 'Monthly' },
    { id: 'year', label: 'Annual' },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Billing interval"
      // Capped rather than full-width: a segmented control that stretches to
      // the container leaves the labels stranded at one end.
      className={cn(
        'grid w-full max-w-xs grid-cols-2 gap-1 rounded-xl border border-border bg-muted p-1',
        className,
      )}
    >
      {options.map((option) => {
        const selected = value === option.id;

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              'flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-3',
              'text-sm transition-colors duration-fast ease-out',
              'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-muted',
              selected
                ? 'bg-card font-semibold text-foreground shadow-xs'
                : 'font-medium text-muted-foreground hover:text-foreground',
            )}
          >
            <span>{option.label}</span>

            {option.id === 'year' && savingLabel && (
              // Success-toned, because it states a benefit. A neutral grey chip
              // here read as metadata rather than as "this one is cheaper".
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-2xs font-semibold whitespace-nowrap',
                  selected ? 'bg-success-subtle text-success' : 'text-success',
                )}
              >
                {savingLabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
