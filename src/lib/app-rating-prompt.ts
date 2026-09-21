/**
 * "Rate the app" — the pure rules around the platform-feedback prompt.
 *
 * React-free and DOM-free so it can be unit-tested with `node --test`
 * alongside the rest of `src/lib`, the same way `onboarding-tour.ts` is.
 *
 * The authoritative anti-nag rule is server-side (one rating per user per 30
 * days, enforced in app-rating-service.ts). What lives here is the *local*
 * half: remembering that this browser already offered the prompt for a
 * specific event, so closing the dialog is not undone by a reload.
 */

/** Mirrors APP_RATING_SOURCES in the API's src/models/app-rating.ts. */
export const APP_RATING_SOURCES = [
  'contract_completed',
  'milestone_released',
  'proposal_submitted',
  'proposal_accepted',
  'ai_recommendations',
  'ai_proposal_draft',
  'ai_skill_extraction',
  'manual',
] as const;

export type AppRatingSource = typeof APP_RATING_SOURCES[number];

/** localStorage key for the persisted dismissal log. */
export const DISMISSAL_STORAGE_KEY = 'app-rating-dismissals';

export const MAX_COMMENT_LENGTH = 2000;

/**
 * How long a dismissal silences a *source* (not just one event).
 *
 * Someone who waves away the prompt after finishing a contract should not meet
 * it again on the next contract a day later. It does not silence other sources,
 * and it does not consume the server-side 30-day window.
 */
export const DISMISSAL_COOLDOWN_DAYS = 14;

/** After this many dismissals we stop asking automatically, for good. */
export const MAX_DISMISSALS = 3;

export type AppRatingDraft = {
  rating: number;
  comment: string;
};

export type Dismissal = {
  source: AppRatingSource;
  /** The contract/proposal/project the prompt came from, when there was one. */
  contextId?: string;
  /** ISO timestamp. */
  at: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function isAppRatingSource(value: unknown): value is AppRatingSource {
  return typeof value === 'string' && (APP_RATING_SOURCES as readonly string[]).includes(value);
}

/**
 * Validate a draft before submitting.
 *
 * Note the deliberate difference from `validateReviewDraft` in review-form.ts:
 * there the comment is mandatory, because a contract review that says only
 * "3 stars" helps nobody judge a counterparty. Here the comment is optional —
 * requiring prose is the single most reliable way to stop people answering,
 * and a bare star is still a usable signal.
 */
export function validateAppRatingDraft(draft: AppRatingDraft): string | null {
  if (!Number.isInteger(draft.rating) || draft.rating < 1 || draft.rating > 5) {
    return 'Pick a rating from 1 to 5 stars.';
  }
  if (draft.comment.length > MAX_COMMENT_LENGTH) {
    return `Keep your comment under ${MAX_COMMENT_LENGTH} characters.`;
  }
  return null;
}

/**
 * Should this browser offer the prompt for this event?
 *
 * `now` is a parameter rather than a `Date.now()` call so the rule is
 * deterministic under `node --test`.
 */
export function shouldPromptFor(
  source: AppRatingSource,
  contextId: string | undefined,
  dismissals: Dismissal[],
  now: number = Date.now(),
): boolean {
  // Opening the form from the account menu is never suppressed.
  if (source === 'manual') return true;

  if (dismissals.length >= MAX_DISMISSALS) return false;

  const cooldownStart = now - DISMISSAL_COOLDOWN_DAYS * DAY_MS;

  return !dismissals.some((dismissal) => {
    if (dismissal.source !== source) return false;
    // This exact event was already waved away — never ask about it again,
    // however long ago that was.
    if (contextId !== undefined && dismissal.contextId === contextId) return true;
    return new Date(dismissal.at).getTime() >= cooldownStart;
  });
}

/**
 * Append a dismissal, dropping entries that can no longer affect any decision.
 *
 * A dismissal with a `contextId` is kept forever (it permanently retires that
 * one event); a context-less one only matters for the cooldown window.
 */
export function recordDismissal(
  dismissals: Dismissal[],
  source: AppRatingSource,
  contextId: string | undefined,
  now: number = Date.now(),
): Dismissal[] {
  const cutoff = now - DISMISSAL_COOLDOWN_DAYS * DAY_MS;
  const kept = dismissals.filter(
    (dismissal) => dismissal.contextId !== undefined || new Date(dismissal.at).getTime() >= cutoff,
  );

  return [
    ...kept,
    {
      source,
      ...(contextId === undefined ? {} : { contextId }),
      at: new Date(now).toISOString(),
    },
  ];
}

/** Read the dismissal log, tolerating absent, blocked or corrupt storage. */
export function parseDismissals(raw: string | null): Dismissal[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is Dismissal =>
        typeof entry === 'object' &&
        entry !== null &&
        isAppRatingSource((entry as Dismissal).source) &&
        typeof (entry as Dismissal).at === 'string' &&
        !Number.isNaN(new Date((entry as Dismissal).at).getTime()),
    );
  } catch {
    return [];
  }
}

/** Human label for a source, used in the admin table. */
export const APP_RATING_SOURCE_LABELS: Record<AppRatingSource, string> = {
  contract_completed: 'Contract completed',
  milestone_released: 'Milestone paid',
  proposal_submitted: 'Proposal submitted',
  proposal_accepted: 'Proposal accepted',
  ai_recommendations: 'AI recommendations',
  ai_proposal_draft: 'AI proposal draft',
  ai_skill_extraction: 'AI skill analysis',
  manual: 'Account menu',
};
