/**
 * Copy for trial eligibility.
 *
 * An ineligible user can still subscribe — they just pay from day one. Saying
 * nothing would mean someone who came for a free week gets charged without
 * explanation, so each reason names the fix.
 *
 * No React and no `@/…` runtime imports: this runs under `node --test`.
 */

import type { TrialIneligibleReason, VerificationBlockedReason } from '@/types';

export interface TrialNotice {
  /** One sentence: why there is no trial, and what to do about it. */
  message: string;
  /** Where the fix lives, when there is one. */
  actionHref?: string;
  actionLabel?: string;
}

export function describeTrialIneligibility(
  reason: TrialIneligibleReason | VerificationBlockedReason | null | undefined,
  role: 'freelancer' | 'employer' | 'admin' | undefined,
): TrialNotice | null {
  const dashboard = `/dashboard/${role ?? 'freelancer'}`;

  switch (reason) {
    // Verification now blocks the purchase itself, not just the trial, so the
    // copy says what is actually required rather than offering a paid path.
    case 'email_unverified':
      return {
        message: 'Verify your email address to subscribe to Pro.',
        actionHref: `${dashboard}/settings`,
        actionLabel: 'Verify email',
      };

    case 'kyc_unverified':
      return {
        message: 'Complete identity verification to subscribe to Pro. It takes a few minutes.',
        actionHref: `${dashboard}/verification`,
        actionLabel: 'Verify identity',
      };

    case 'trial_already_used':
      return {
        message: "You've already used your free trial, so this subscription starts billing today.",
      };

    // No trial is on offer at all — say nothing rather than draw attention to
    // something the user was never promised.
    case 'no_trial_offered':
    default:
      return null;
  }
}
