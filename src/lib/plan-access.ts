/**
 * Plan entitlement — the single place that decides who gets Pro.
 *
 * Kept free of React and of `@/…` imports so it runs under `node --test`
 * (see src/lib/*.test.mjs). Nothing else in the app should compare
 * `user.plan` directly: route every check through hasProAccess so the admin
 * carve-out cannot be forgotten at a new call site.
 */

import type { PlanTier, UserRole } from '@/types';

/** The error code the API returns when a Pro feature is hit on a Free plan. */
export const PLAN_UPGRADE_ERROR_CODE = 'PLAN_UPGRADE_REQUIRED';

type PlanUser = {
  role?: UserRole | undefined;
  plan?: PlanTier | undefined;
} | null | undefined;

/** A user's tier, defaulting to Free when the API has not told us yet. */
export function resolvePlan(user: PlanUser): PlanTier {
  return user?.plan === 'pro' ? 'pro' : 'free';
}

/**
 * Whether this user may use Pro features.
 *
 * Admins always may: they operate the platform and are never billed for it.
 * This is the ONLY place that exception lives.
 */
export function hasProAccess(user: PlanUser): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.plan === 'pro';
}

type ErrorLike = {
  response?: {
    status?: number;
    data?: unknown;
  };
};

function extractCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const record = data as Record<string, unknown>;

  if (typeof record['code'] === 'string') return record['code'];

  const error = record['error'];
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const nested = (error as Record<string, unknown>)['code'];
    if (typeof nested === 'string') return nested;
  }

  return undefined;
}

/**
 * True for a 403 that specifically means "upgrade", not "forbidden".
 *
 * Accepts every body shape the API might use ({code}, {error}, {error:{code}})
 * so a server-side shape change degrades to a generic error rather than
 * silently turning the paywall into an unactionable red toast.
 */
export function isPlanUpgradeRequired(error: unknown): boolean {
  const status = (error as ErrorLike)?.response?.status;
  if (status !== 403) return false;
  return extractCode((error as ErrorLike)?.response?.data) === PLAN_UPGRADE_ERROR_CODE;
}
