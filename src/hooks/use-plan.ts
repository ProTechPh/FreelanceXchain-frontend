'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { billingApi } from '@/lib/api';
import { qk, STALE_TIME } from '@/lib/query-keys';
import { hasProAccess, resolvePlan } from '@/lib/plan-access';
import { isAllowedBillingRedirect } from '@/lib/billing-checkout';
import { reportFailure } from '@/lib/report-failure';
import type { PlanTier, Subscription } from '@/types';

export interface PlanState {
  plan: PlanTier;
  isPro: boolean;
  isFree: boolean;
  /**
   * Whether the plan is known for certain (the session has been confirmed
   * against the server this page load). While false, a gate must render a
   * skeleton rather than a lock — otherwise a Pro user sees a paywall flash.
   */
  isResolved: boolean;
  isAdmin: boolean;
}

/**
 * The plan, read from the auth store.
 *
 * This is the only consumer of hasProAccess, and nothing else in the app
 * compares `user.plan` directly — so the admin carve-out lives in exactly one
 * place and cannot be forgotten at a new call site.
 */
export function usePlan(): PlanState {
  const user = useAuthStore((state) => state.user);
  const sessionVerified = useAuthStore((state) => state.sessionVerified);

  const isPro = hasProAccess(user);

  return {
    plan: resolvePlan(user),
    isPro,
    isFree: !isPro,
    isResolved: sessionVerified,
    isAdmin: user?.role === 'admin',
  };
}

/**
 * Subscription detail for the billing page (renewal date, cancellation state).
 * Entitlement itself comes from usePlan — this is the extra detail only one
 * screen needs, deliberately kept out of localStorage.
 */
export function useSubscription(enabled = true) {
  return useQuery<Subscription>({
    queryKey: qk.subscription(),
    queryFn: async () => (await billingApi.getSubscription()).data,
    staleTime: STALE_TIME.none,
    enabled,
  });
}

/**
 * Send the user to Stripe-hosted Checkout.
 *
 * The URL comes back from our API, so it is validated before being assigned to
 * location — an unvalidated assignment would be an open redirect.
 */
export function useStartCheckout() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await billingApi.createCheckoutSession();
      return data.url;
    },
    onSuccess: (url) => {
      if (!isAllowedBillingRedirect(url)) {
        reportFailure(new Error('Unexpected checkout URL'), 'start checkout');
        return;
      }
      window.location.href = url;
    },
    onError: (error) => reportFailure(error, 'start checkout'),
  });
}

/** Open the Stripe Customer Portal (cancel, resume, update card, invoices). */
export function useOpenBillingPortal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await billingApi.createPortalSession();
      return data.url;
    },
    onSuccess: (url) => {
      if (!isAllowedBillingRedirect(url)) {
        reportFailure(new Error('Unexpected portal URL'), 'open billing settings');
        return;
      }
      // Anything changed in the portal must be re-read when the user returns.
      void queryClient.invalidateQueries({ queryKey: qk.subscription() });
      window.location.href = url;
    },
    onError: (error) => reportFailure(error, 'open billing settings'),
  });
}
