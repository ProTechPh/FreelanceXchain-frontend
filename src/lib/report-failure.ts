import { toast } from 'sonner';

import {
  describeFailure,
  type DescribeFailureOptions,
  type FailureMessage,
} from './error-messages.ts';

/**
 * Show a failure to the user, once, in the right register.
 *
 * Routing by tone is the point: a wallet rejection arrives as a neutral notice,
 * a recoverable fault as a warning, and only a genuine fault turns the toast
 * red. Previously all three were `toast.error`, so "you cancelled this" and
 * "your payment may have failed" looked identical on a platform holding escrow.
 */

export interface ReportFailureOptions extends DescribeFailureOptions {
  /**
   * Wired to the toast's Retry button. Only offered when the failure is
   * actually retryable — a Retry on an invalid form would do nothing.
   */
  onRetry?: () => void;
  retryLabel?: string;
  /** Dedupe key, so a retried action replaces its own toast instead of stacking. */
  id?: string;
}

/** A message with a next step needs longer than sonner's 4s default to read. */
const DURATION = {
  info: 5_000,
  warning: 7_000,
  destructive: 9_000,
} as const;

export function reportFailure(
  error: unknown,
  action: string,
  options: ReportFailureOptions = {},
): string | number {
  const { onRetry, retryLabel = 'Retry', id, ...describeOptions } = options;
  const failure = describeFailure(error, action, describeOptions);

  // The user-facing copy is deliberately generic for server faults, so keep the
  // real error where a developer can still find it.
  if (failure.kind === 'server' || failure.kind === 'unknown') {
    console.error(`[failure] could not ${action}`, error);
  }

  const config = {
    id,
    description: failure.detail,
    duration: DURATION[failure.tone],
    action: failure.retryable && onRetry
      ? { label: retryLabel, onClick: onRetry }
      : undefined,
  };

  if (failure.tone === 'info') return toast.info(failure.title, config);
  if (failure.tone === 'warning') return toast.warning(failure.title, config);
  return toast.error(failure.title, config);
}

/**
 * For a failed read. Same routing, but a Retry button is the whole point, so the
 * caller's refetch is required rather than optional.
 */
export function reportLoadFailure(
  error: unknown,
  subject: string,
  onRetry: () => void,
  options: Omit<ReportFailureOptions, 'onRetry'> = {},
): string | number {
  return reportFailure(error, `load ${subject}`, {
    ...options,
    onRetry,
    // One id per subject: refetching replaces the toast instead of stacking a
    // second copy of the same complaint.
    id: options.id ?? `load:${subject}`,
  });
}

export type { FailureMessage };
