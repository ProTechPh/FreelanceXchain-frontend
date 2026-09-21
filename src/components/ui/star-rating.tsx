'use client';

import * as React from 'react';
import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

const STARS = [1, 2, 3, 4, 5] as const;

/**
 * Labels shown beside the interactive widget. Naming each value stops "3 stars"
 * meaning something different to every person who picks it.
 */
const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Not great',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent',
};

type StarRatingProps = {
  /** 0 means "nothing picked yet". Fractional values are allowed when read-only. */
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Show the word for the selected value next to the stars. */
  showLabel?: boolean;
  className?: string;
  'aria-label'?: string;
};

const SIZE_CLASSES = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
} as const;

/**
 * The project's one star widget, in both modes.
 *
 * Before this, every star on the site was an ad-hoc `<Star className="size-4
 * text-warning fill-warning" />` and the only rating *input* was a `<select>`
 * of 5..1. The token pairing below is deliberately the same one those ad-hoc
 * icons use, so a rating rendered here matches every other star in the app.
 */
export function StarRating({
  value,
  onChange,
  readOnly = false,
  disabled = false,
  size = 'md',
  showLabel = false,
  className,
  'aria-label': ariaLabel = 'Rating',
}: StarRatingProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const interactive = !readOnly && !disabled && typeof onChange === 'function';

  // While hovering, preview that value instead of the committed one.
  const shown = hovered ?? value;

  if (!interactive) {
    return (
      <span
        className={cn('inline-flex items-center gap-0.5', className)}
        role="img"
        aria-label={`${ariaLabel}: ${round(value)} out of 5`}
      >
        {STARS.map((star) => (
          <ReadOnlyStar key={star} star={star} value={value} sizeClass={SIZE_CLASSES[size]} />
        ))}
        {showLabel && value > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">{round(value)}</span>
        )}
      </span>
    );
  }

  const move = (delta: number) => {
    const next = Math.min(5, Math.max(1, (value || 0) + delta));
    onChange?.(next);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHovered(null)}
        onKeyDown={(event) => {
          // Arrow keys move through the scale, so the widget is usable without
          // a pointer — the reason this is a radiogroup and not five buttons.
          if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            event.preventDefault();
            move(1);
          } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            event.preventDefault();
            move(-1);
          }
        }}
      >
        {STARS.map((star) => {
          const filled = star <= shown;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} ${star === 1 ? 'star' : 'stars'} — ${RATING_LABELS[star]}`}
              // Only the selected star (or the first, when nothing is selected)
              // is in the tab order; arrows reach the rest.
              tabIndex={value === star || (value === 0 && star === 1) ? 0 : -1}
              onClick={() => onChange?.(star)}
              onMouseEnter={() => setHovered(star)}
              onFocus={() => setHovered(star)}
              onBlur={() => setHovered(null)}
              className={cn(
                'rounded-sm p-0.5 cursor-pointer touch-manipulation',
                'transition-transform duration-fast ease-out',
                'hover:scale-110 active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
              <Star
                className={cn(
                  SIZE_CLASSES[size],
                  'transition-colors duration-fast',
                  filled ? 'text-warning fill-warning' : 'text-muted-foreground/40',
                )}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
      {showLabel && (
        // Reserved height, so picking a star does not shift the dialog.
        <span className="min-h-5 text-sm font-medium text-muted-foreground">
          {shown > 0 ? RATING_LABELS[Math.round(shown)] : ''}
        </span>
      )}
    </div>
  );
}

/** One star in display mode, with partial fill for fractional averages. */
function ReadOnlyStar({ star, value, sizeClass }: { star: number; value: number; sizeClass: string }) {
  const fill = Math.min(1, Math.max(0, value - (star - 1)));

  if (fill === 0) {
    return <Star className={cn(sizeClass, 'text-muted-foreground/40')} aria-hidden="true" />;
  }
  if (fill === 1) {
    return <Star className={cn(sizeClass, 'text-warning fill-warning')} aria-hidden="true" />;
  }

  // Partial: an empty star with a clipped full one laid over it.
  return (
    <span className={cn('relative inline-block', sizeClass)} aria-hidden="true">
      <Star className={cn(sizeClass, 'absolute inset-0 text-muted-foreground/40')} />
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
        <Star className={cn(sizeClass, 'text-warning fill-warning')} />
      </span>
    </span>
  );
}

function round(value: number): string {
  return (Math.round(value * 10) / 10).toString();
}
