/**
 * Plan desync notifier.
 *
 * Exists only to break an import cycle: the axios client needs to ask the auth
 * store to refresh the plan, but the auth store imports the axios client. The
 * store registers a handler here at module scope; the client just fires an
 * event and knows nothing about the store.
 *
 * Throttled because a page can fire several gated requests at once, and one
 * desync should cost one /auth/me call, not one per request.
 */

type DesyncHandler = () => void;

const THROTTLE_MS = 30_000;

let handler: DesyncHandler | null = null;
let lastNotifiedAt = 0;

export function registerPlanDesyncHandler(fn: DesyncHandler): void {
  handler = fn;
}

/**
 * Called when the API says a feature needs Pro but the client believed it had
 * it — i.e. the cached plan is stale (cancelled on another device, or an
 * expired subscription in a long-lived tab).
 */
export function notifyPlanDesync(): void {
  if (!handler) return;

  const now = Date.now();
  if (now - lastNotifiedAt < THROTTLE_MS) return;
  lastNotifiedAt = now;

  handler();
}

/** Test-only: clear the registered handler and throttle window. */
export function resetPlanDesync(): void {
  handler = null;
  lastNotifiedAt = 0;
}
