import * as React from 'react';

import { cn } from '@/lib/utils';
import {
  getStatusDescriptor,
  type StatusDomain,
  type StatusTone,
} from '@/lib/status-styles';

interface StatusBadgeProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  /** Raw status from the API, e.g. "in_progress". */
  status: string;
  /** Refines statuses whose meaning is context-dependent, e.g. a dispute's "open". */
  domain?: StatusDomain;
  /** Override the derived label. The tone still comes from the status. */
  label?: string;
  /** Show a solid tone dot before the label. Useful in dense lists. */
  showDot?: boolean;
  size?: 'sm' | 'default';
}

const SIZE_CLASS = {
  sm: 'h-5 px-1.5 text-2xs gap-1',
  default: 'h-6 px-2 text-xs gap-1.5',
} as const;

/**
 * The single way to render an entity's state.
 *
 * Tone, label and styling all resolve from `@/lib/status-styles`, so a contract
 * reads identically on the freelancer side and the employer side. Pages must not
 * hand-roll status colors.
 *
 * The status is also exposed to assistive tech as text, not colour alone
 * (WCAG 1.4.1) — the dot is decorative and the label always renders.
 */
function StatusBadge({
  status,
  domain,
  label,
  showDot = false,
  size = 'default',
  className,
  ...props
}: StatusBadgeProps) {
  const descriptor = getStatusDescriptor(status, domain);

  return (
    <span
      data-slot="status-badge"
      data-tone={descriptor.tone}
      data-status={status}
      className={cn(
        'inline-flex w-fit shrink-0 items-center justify-center rounded-full border font-medium whitespace-nowrap',
        SIZE_CLASS[size],
        descriptor.className,
        className,
      )}
      {...props}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={cn('size-1.5 shrink-0 rounded-full', descriptor.dotClassName)}
        />
      )}
      {label ?? descriptor.label}
    </span>
  );
}

/** Standalone tone dot, for rows too dense for a full badge. */
function StatusDot({
  status,
  domain,
  className,
  ...props
}: { status: string; domain?: StatusDomain } & React.ComponentProps<'span'>) {
  const descriptor = getStatusDescriptor(status, domain);
  return (
    <span
      role="img"
      aria-label={descriptor.label}
      data-tone={descriptor.tone}
      className={cn('inline-block size-2 shrink-0 rounded-full', descriptor.dotClassName, className)}
      {...props}
    />
  );
}

export { StatusBadge, StatusDot, type StatusTone };
