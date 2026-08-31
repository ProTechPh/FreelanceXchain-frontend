/**
 * One place to turn any thrown value into copy a user can act on.
 *
 * This platform moves real money through escrow, so a failure message has to
 * answer three questions in order: what happened, is my money safe, and what do
 * I do now. Two failures matter most and were previously indistinguishable: a
 * wallet rejection (the user chose this; nothing was signed) and a server fault
 * (we broke; state is unknown). Rendering both as a red "Failed to..." toast is
 * what made people retry payments they had already made.
 *
 * Copy follows skill.md "Content and tone": concise, confident, sentence case.
 * Raw provider strings never reach the UI - ethers v6 wraps a rejection in a
 * multi-line blob ending `code=ACTION_REJECTED, version=6.x`, and a 5xx body is
 * usually a stack trace.
 */

import type { StatusTone } from './status-styles.ts';

export type FailureKind =
  /** The user declined in their wallet. Not an error - nothing was signed. */
  | 'cancelled'
  /** The request never left the browser. */
  | 'offline'
  | 'timeout'
  /** 401 - the session lapsed. */
  | 'auth'
  /** 403 - signed in, but not allowed to do this. */
  | 'forbidden'
  /** 400/422 - the backend message names the field and is safe to show. */
  | 'validation'
  /** 409 - the record moved before the request landed. */
  | 'conflict'
  | 'rate-limit'
  /** 5xx - our fault, and the user should not be asked to debug it. */
  | 'server'
  /** Wallet reachable but cannot proceed: funds, chain, or a pending prompt. */
  | 'wallet'
  | 'unknown';

export interface FailureMessage {
  kind: FailureKind;
  /** Reuses the design system's tone vocabulary; never colour-alone in the UI. */
  tone: Extract<StatusTone, 'destructive' | 'warning' | 'info'>;
  /** Sentence case, no trailing period - it is a heading, not a sentence. */
  title: string;
  /** What to do next. Full sentences. */
  detail?: string;
  /** Whether offering a Retry affordance makes sense. */
  retryable: boolean;
}

export interface DescribeFailureOptions {
  /**
   * Set only when the caller *knows* no funds moved - a wallet rejection, or a
   * request that failed before anything was signed. Claiming this on a 5xx
   * would be a lie: the write may well have committed.
   */
  fundsUnchanged?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function responseStatus(error: unknown): number | null {
  if (!isRecord(error) || !isRecord(error.response)) return null;
  return typeof error.response.status === 'number' ? error.response.status : null;
}

/** Every place a provider or HTTP client hides a numeric error code. */
function errorCodes(error: unknown): Array<string | number> {
  if (!isRecord(error)) return [];

  const codes: Array<string | number> = [];
  const push = (value: unknown) => {
    if (typeof value === 'string' || typeof value === 'number') codes.push(value);
  };

  push(error.code);
  // ethers v6 nests the untouched EIP-1193 error under `info.error`.
  if (isRecord(error.info)) {
    push(error.info.code);
    if (isRecord(error.info.error)) push(error.info.error.code);
  }
  // Some providers nest one level without `info`.
  if (isRecord(error.error)) push(error.error.code);
  if (isRecord(error.cause)) push(error.cause.code);

  return codes;
}

function errorText(error: unknown): string {
  if (typeof error === 'string') return error.toLowerCase();
  if (!isRecord(error)) return '';

  const parts: string[] = [];
  if (typeof error.message === 'string') parts.push(error.message);
  if (typeof error.reason === 'string') parts.push(error.reason);
  if (typeof error.shortMessage === 'string') parts.push(error.shortMessage);
  if (
    isRecord(error.info)
    && isRecord(error.info.error)
    && typeof error.info.error.message === 'string'
  ) {
    parts.push(error.info.error.message);
  }
  return parts.join(' ').toLowerCase();
}

/**
 * True when the user pressed Cancel or Reject in their wallet.
 *
 * ethers surfaces this as `code: 'ACTION_REJECTED'`; a bare EIP-1193 provider
 * uses `4001`. Both spellings occur here because `wallet.ts` calls
 * `provider.request` directly *and* goes through ethers.
 */
function isUserRejection(error: unknown): boolean {
  const codes = errorCodes(error);
  if (codes.includes('ACTION_REJECTED') || codes.includes(4001)) return true;

  const text = errorText(error);
  return text.includes('user rejected')
    || text.includes('user denied')
    || text.includes('rejected the request');
}

function walletProblem(error: unknown): FailureMessage | null {
  const codes = errorCodes(error);
  const text = errorText(error);

  // -32002: a prompt is already open. Users read the old generic failure as
  // "broken" and click again, which queues yet another prompt.
  if (codes.includes(-32002) || text.includes('already pending')) {
    return {
      kind: 'wallet',
      tone: 'warning',
      title: 'Your wallet is already asking you to confirm',
      detail: 'Open your wallet, finish or dismiss the pending request, then try again.',
      retryable: false,
    };
  }

  if (codes.includes('INSUFFICIENT_FUNDS') || text.includes('insufficient funds')) {
    return {
      kind: 'wallet',
      tone: 'destructive',
      title: 'Not enough funds in your wallet',
      detail: 'Top up the connected account to cover the amount plus gas, then try again.',
      retryable: false,
    };
  }

  // 4902: the chain is not added to the wallet yet.
  if (codes.includes(4902) || text.includes('unrecognized chain')) {
    return {
      kind: 'wallet',
      tone: 'warning',
      title: 'That network is not set up in your wallet',
      detail: 'Add or switch to the required network in your wallet, then try again.',
      retryable: true,
    };
  }

  if (text.includes('no wallet account')) {
    return {
      kind: 'wallet',
      tone: 'warning',
      title: 'No account selected',
      detail: 'Choose an account in your wallet to continue.',
      retryable: true,
    };
  }

  return null;
}

/**
 * The backend's own message, when there is one.
 *
 * Kept for validation and conflict responses, where it names the exact field or
 * rule and beats anything generic. Deliberately ignored for 5xx, where the body
 * is an internal trace.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isRecord(error) || !isRecord(error.response)) return fallback;

  const data = error.response.data;
  if (!isRecord(data)) return fallback;

  if (typeof data.error === 'string' && data.error.trim()) return data.error;
  if (typeof data.message === 'string' && data.message.trim()) return data.message;
  if (!isRecord(data.error)) return fallback;

  return typeof data.error.message === 'string' && data.error.message.trim()
    ? data.error.message
    : fallback;
}

/**
 * The backend message, or null when it has nothing specific to say.
 *
 * Reads the same shapes as `getApiErrorMessage` but reports absence directly,
 * rather than round-tripping a sentinel string through the fallback.
 */
function backendMessage(error: unknown): string | null {
  if (!isRecord(error) || !isRecord(error.response)) return null;

  const data = error.response.data;
  if (!isRecord(data)) return null;

  if (typeof data.error === 'string' && data.error.trim()) return data.error;
  if (typeof data.message === 'string' && data.message.trim()) return data.message;
  if (!isRecord(data.error)) return null;

  return typeof data.error.message === 'string' && data.error.message.trim()
    ? data.error.message
    : null;
}

export function classifyFailure(error: unknown): FailureKind {
  if (isUserRejection(error)) return 'cancelled';

  const status = responseStatus(error);

  if (status === null) {
    const codes = errorCodes(error);
    if (codes.includes('ECONNABORTED') || codes.includes('ETIMEDOUT')) return 'timeout';
    if (codes.includes('ERR_NETWORK')) return 'offline';

    if (walletProblem(error)) return 'wallet';

    // No HTTP response at all. Separating "this browser has no network" from
    // "something else broke" is the difference between a message the user can
    // act on and one they cannot.
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if (offline) return 'offline';

    const text = errorText(error);
    if (text.includes('timeout') || text.includes('timed out')) return 'timeout';
    if (text.includes('network error') || text.includes('failed to fetch')) return 'offline';

    return 'unknown';
  }

  if (status === 401) return 'auth';
  if (status === 403) return 'forbidden';
  if (status === 408) return 'timeout';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rate-limit';
  if (status >= 500) return 'server';
  if (status >= 400) return 'validation';

  return 'unknown';
}

/**
 * Compose user-facing copy for a failure.
 *
 * `action` is a lowercase verb phrase completing "We couldn't ..." - for example
 * `'submit your proposal'` or `'load your contracts'`. Passing the action
 * instead of a whole sentence is what keeps wording consistent across the app
 * rather than re-invented at each of ~165 call sites.
 */
export function describeFailure(
  error: unknown,
  action: string,
  options: DescribeFailureOptions = {},
): FailureMessage {
  const kind = classifyFailure(error);
  const safe = options.fundsUnchanged ? ' No funds moved.' : '';

  switch (kind) {
    case 'cancelled':
      // Never destructive: the user got exactly what they asked for.
      return {
        kind,
        tone: 'info',
        title: 'Cancelled in your wallet',
        detail: 'Nothing was submitted and no funds moved.',
        retryable: true,
      };

    case 'offline':
      return {
        kind,
        tone: 'warning',
        title: 'You appear to be offline',
        detail: `We couldn't ${action}. Check your connection and try again.${safe}`,
        retryable: true,
      };

    case 'timeout':
      return {
        kind,
        tone: 'warning',
        title: 'That took too long',
        detail: `We couldn't ${action} in time. Try again in a moment.`,
        retryable: true,
      };

    case 'auth':
      return {
        kind,
        tone: 'warning',
        title: 'Your session has expired',
        detail: `Sign in again to ${action}.`,
        retryable: false,
      };

    case 'forbidden':
      return {
        kind,
        tone: 'warning',
        title: "You don't have permission to do that",
        detail: 'If you think this is wrong, contact an administrator.',
        retryable: false,
      };

    case 'validation': {
      // The backend named the offending field; that beats anything generic.
      const specific = backendMessage(error);
      return {
        kind,
        tone: 'warning',
        title: specific ?? `We couldn't ${action}`,
        detail: specific ? undefined : 'Check the details you entered and try again.',
        retryable: false,
      };
    }

    case 'conflict':
      return {
        kind,
        tone: 'warning',
        title: 'This has already changed',
        detail: backendMessage(error)
          ?? `Someone updated it before we could ${action}. Refresh to see the latest.`,
        retryable: true,
      };

    case 'rate-limit':
      return {
        kind,
        tone: 'warning',
        title: 'Too many attempts',
        detail: 'Wait a moment, then try again.',
        retryable: true,
      };

    case 'server':
      // No backend text here on purpose - it is a stack trace - and no claim
      // about funds either, because a 5xx may have committed the write.
      return {
        kind,
        tone: 'destructive',
        title: `We couldn't ${action}`,
        detail: 'This is a problem on our side, not yours. Try again shortly.',
        retryable: true,
      };

    case 'wallet': {
      const problem = walletProblem(error);
      if (problem) return problem;
      return {
        kind,
        tone: 'destructive',
        title: `Your wallet couldn't ${action}`,
        detail: 'Check that your wallet is unlocked and on the right network, then try again.',
        retryable: true,
      };
    }

    default:
      return {
        kind: 'unknown',
        tone: 'destructive',
        title: `We couldn't ${action}`,
        detail: `Something went wrong. Try again - if it keeps happening, contact support.${safe}`,
        retryable: true,
      };
  }
}

/** Single line for contexts with no room for a separate title and detail. */
export function failureLine(
  error: unknown,
  action: string,
  options?: DescribeFailureOptions,
): string {
  const { title, detail } = describeFailure(error, action, options);
  return detail ? `${title}. ${detail}` : title;
}
