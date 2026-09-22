/**
 * Shared presentation constants for support tickets.
 *
 * Kept out of the components so the ticket form, the submitter's own list and
 * the admin queue all label a category the same way — the submitter and the
 * admin reading their ticket must be looking at the same words.
 *
 * Mirrors the server-side limits in FreelanceXchain-api
 * `src/models/support-ticket.ts`; the server is still the authority, this just
 * lets the form say so before the round trip.
 */

import type { SupportTicketCategory, SupportTicketStatus } from '@/types';

export const MIN_SUBJECT_LENGTH = 5;
export const MAX_SUBJECT_LENGTH = 120;
export const MIN_DESCRIPTION_LENGTH = 20;
export const MAX_DESCRIPTION_LENGTH = 4000;
export const MAX_RESOLUTION_LENGTH = 2000;

/**
 * Typed as a total record, so adding a category to `SupportTicketCategory`
 * without labelling it here is a compile error rather than a raw enum leaking
 * into the UI.
 */
export const TICKET_CATEGORY_LABELS: Record<SupportTicketCategory, string> = {
  account: 'Account & sign-in',
  verification: 'Identity verification',
  payments: 'Payments & escrow',
  contracts: 'Contracts & milestones',
  disputes: 'Disputes',
  technical: 'Something is broken',
  other: 'Something else',
};

/** Order for the category picker. Derived, so it can never miss a category. */
export const TICKET_CATEGORY_ORDER = Object.keys(
  TICKET_CATEGORY_LABELS
) as SupportTicketCategory[];

/**
 * What each status means to the person reading it.
 *
 * `StatusBadge` supplies the label; this is the sentence underneath it, and it
 * is written for the submitter — "we have seen it" rather than "assigned".
 */
export const TICKET_STATUS_HINTS: Record<SupportTicketStatus, string> = {
  open: 'Waiting for us to pick it up.',
  in_progress: 'Someone is looking into this now.',
  resolved: 'Answered — see the reply below.',
  closed: 'Closed without a reply. Open a new ticket if it is still a problem.',
};
