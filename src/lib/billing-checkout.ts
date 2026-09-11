/**
 * Checkout return policy.
 *
 * Entitlement is granted by a Stripe webhook, which can land slightly AFTER
 * the browser is redirected back. So the success page polls rather than
 * trusting the redirect — and, critically, never renders "you are still on
 * Free" while it waits: the payment succeeded, only activation is pending.
 *
 * The schedule and the URL guards live here (not in a component) so they are
 * unit-testable. No React, no `@/…` runtime imports.
 */

/**
 * Delays before each entitlement re-check, in ms. Six attempts over ~19s:
 * long enough for a normal webhook, short enough that a stuck one is reported
 * rather than spun on forever.
 */
export const CHECKOUT_POLL_DELAYS_MS: readonly number[] = [0, 1000, 2000, 3000, 5000, 8000];

export const CHECKOUT_MAX_ATTEMPTS = CHECKOUT_POLL_DELAYS_MS.length;

/** Delay before attempt `n` (0-indexed), or null when the budget is spent. */
export function nextPollDelay(attempt: number): number | null {
  if (attempt < 0 || attempt >= CHECKOUT_POLL_DELAYS_MS.length) return null;
  return CHECKOUT_POLL_DELAYS_MS[attempt] ?? null;
}

export type CheckoutState = 'confirmed' | 'waiting' | 'timed-out';

/**
 * What the success page should show.
 *
 * Note there is no "failed" state: reaching this page at all means Stripe took
 * the payment. Running out of attempts means activation is slow, not that the
 * payment did not happen.
 */
export function resolveCheckoutState(input: { isPro: boolean; attempt: number }): CheckoutState {
  if (input.isPro) return 'confirmed';
  if (input.attempt >= CHECKOUT_MAX_ATTEMPTS) return 'timed-out';
  return 'waiting';
}

const ALLOWED_REDIRECT_HOSTS = ['checkout.stripe.com', 'billing.stripe.com'];

/**
 * Whether a URL returned by our API is safe to send the browser to.
 *
 * The response is attacker-adjacent input: assigning it to location without a
 * check would turn a compromised or buggy endpoint into an open redirect.
 * Only HTTPS Stripe hosts are allowed, matched on the exact host or a
 * dot-prefixed suffix so `checkout.stripe.com.evil.com` cannot slip through.
 */
export function isAllowedBillingRedirect(url: string | null | undefined): boolean {
  if (!url) return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'https:') return false;

  return ALLOWED_REDIRECT_HOSTS.some(
    (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
  );
}

/**
 * Normalise a `returnTo` query value into a safe in-app path.
 *
 * Only same-origin relative paths are accepted. Anything absolute,
 * protocol-relative or scheme-bearing falls back, so a crafted link cannot use
 * our own success page as a redirector.
 */
export function getBillingReturnPath(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;

  // Reject protocol-relative ("//evil.com") and any scheme ("javascript:",
  // "https://evil.com") before touching the URL parser.
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return fallback;

  // A backslash can be normalised to a slash by some browsers, so "/\evil.com"
  // is effectively protocol-relative.
  if (value.startsWith('/\\')) return fallback;

  return value;
}
