import type { UserRole } from '@/types';

/**
 * Onboarding tour content and the pure rules around it.
 *
 * Everything here is deliberately free of React and of the DOM so it can be
 * unit-tested with `node --test` alongside the rest of `src/lib`. The overlay in
 * `src/components/onboarding/` is a thin renderer over these functions.
 */

/** The two participant roles. Admins moderate the platform and are not taught it. */
export type TourRole = 'freelancer' | 'employer';

/** localStorage key for the persisted store. */
export const TOUR_STORAGE_KEY = 'onboarding-tour';

/**
 * Bump this when the steps change materially. A user whose recorded completion
 * predates the current version is offered the tour again rather than silently
 * missing whatever was added.
 */
export const TOUR_VERSION = 1;

export interface TourStep {
  id: string;
  title: string;
  body: string;
  /**
   * CSS selector for the element to spotlight. Omitted for the opening step,
   * which is a centred card because it introduces the product, not a control.
   */
  target?: string;
  /**
   * Selector used below `lg`, where the sidebar is not in the layout at all.
   * Falls back to `target` when omitted.
   */
  mobileTarget?: string;
  /** Preferred side for the desktop bubble. Collision handling may override it. */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /**
   * Below `lg`, open the navigation drawer for this step.
   *
   * Ringing a closed hamburger tells nobody what is behind it. The drawer holds
   * the only copy of the navigation on a phone, so the step that talks about
   * navigation has to actually show it.
   */
  opensNav?: boolean;
  /**
   * The features this step covers, listed under the body.
   *
   * Steps group two or three related features rather than getting one each:
   * a tour long enough to name every screen is a tour nobody finishes.
   */
  items?: string[];
}

const freelancerSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to FreelanceXchain',
    body: 'You take on work in milestones, and the money for each one is locked in a smart contract before you start. Neither side has to trust the other. Here is where everything lives.',
  },
  {
    id: 'navigation',
    title: 'Everything you need is in here',
    // No feature list on this step: the spotlight is the navigation itself, and
    // repeating its group names in the card would only crowd out the nav it is
    // pointing at -- which matters most on a phone, where the drawer and the
    // card are sharing one small screen.
    body: 'Grouped by what you are doing: finding work, doing it, and getting paid.',
    target: '[data-tour="nav"]',
    mobileTarget: '[data-tour="nav-drawer"]',
    opensNav: true,
    side: 'right',
  },
  {
    id: 'find-work',
    title: 'Find work that fits',
    body: 'Projects are matched against the skills you have verified, so the list is worth reading.',
    target: '[data-tour="primary-cta"]',
    side: 'bottom',
    items: ['Browse projects and filter by skill or budget', 'Recommended — AI-matched to your stack', 'Save a search and come back to it'],
  },
  {
    id: 'proposals',
    title: 'Send a proposal that stands out',
    body: 'A proposal is a plan, not a price. Break the job into milestones and each one becomes a funded escrow step.',
    target: '[data-tour="proposals"]',
    side: 'top',
    items: ['Generate a first draft with AI, then edit it', 'Split the work into milestones with amounts', 'Track every bid and its decision'],
  },
  {
    id: 'wallet',
    title: 'Connect a wallet to get paid',
    body: 'Payouts go straight to your wallet the moment a milestone is approved.',
    target: '[data-tour="wallet"]',
    side: 'bottom',
    items: ['MetaMask, Coinbase Wallet and other EVM wallets', 'Linking is free — no gas fees to connect', 'The employer funds escrow before you start'],
  },
  {
    id: 'contracts',
    title: 'Deliver in the contract workspace',
    body: 'Every awarded project gets a shared workspace with the employer.',
    target: '[data-tour="active-work"]',
    side: 'top',
    items: ['Upload deliverables against each milestone', 'Approval releases that milestone automatically', 'Revisions are requested in the same place'],
  },
  {
    id: 'earnings',
    title: 'Watch the money land',
    body: 'Two records, kept apart on purpose: the payment ledger is what you were paid, the blockchain record is what settled on chain.',
    target: '[data-tour="earnings"]',
    side: 'bottom',
    items: ['Earnings — totals and history by date range', 'Transactions — the on-chain record', 'Reputation grows with every completed contract'],
  },
  {
    id: 'messages',
    title: 'Stay in touch, and get help if it goes wrong',
    body: 'Talk to employers before and during a contract, and escalate only if you have to.',
    target: '[data-tour="notifications"]',
    side: 'bottom',
    items: ['Messages — direct chat, per project', 'Notifications — decisions, approvals, payouts', 'Disputes — evidence reviewed against on-chain records'],
  },
  {
    id: 'profile',
    title: 'Build a profile people hire',
    body: 'Verified skills and a real portfolio are what move you up the match rankings.',
    target: '[data-tour="account"]',
    side: 'bottom',
    items: ['Portfolio — show the work itself', 'Identity verification — earn the verified badge', 'Skill analysis — see the gaps worth closing'],
  },
];

const employerSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to FreelanceXchain',
    body: 'You hire in milestones and fund each one into a smart contract before work starts. Freelancers know they will be paid, and you only release money for work you have approved.',
  },
  {
    id: 'navigation',
    title: 'Everything you need is in here',
    // See the note on the freelancer navigation step: the spotlight already
    // shows these groups, so listing them again would just crowd them out.
    body: 'Grouped by what you are doing: hiring, running contracts, and tracking spend.',
    target: '[data-tour="nav"]',
    mobileTarget: '[data-tour="nav-drawer"]',
    opensNav: true,
    side: 'right',
  },
  {
    id: 'post-project',
    title: 'Post your first project',
    body: 'Clear scope and honest milestones get better proposals than a big budget does.',
    target: '[data-tour="primary-cta"]',
    side: 'bottom',
    items: ['Describe the work and the stack you need', 'Split the budget into milestones with deadlines', 'Publish and start receiving bids'],
  },
  {
    id: 'proposals',
    title: 'Review bids and award the work',
    body: 'Proposals are ranked by how well the freelancer matches what you asked for.',
    target: '[data-tour="proposals"]',
    side: 'top',
    items: ['Compare ranked bids and milestone plans', 'Check on-chain history and verified skills', 'Message a candidate before you commit'],
  },
  {
    id: 'wallet',
    title: 'Fund escrow before work starts',
    body: 'Milestone funds lock into the contract, so the freelancer can start knowing the money is there.',
    target: '[data-tour="wallet"]',
    side: 'bottom',
    items: ['MetaMask, Coinbase Wallet and other EVM wallets', 'Fund one milestone at a time', 'Nothing is released until you approve it'],
  },
  {
    id: 'contracts',
    title: 'Approve deliverables to release payment',
    body: 'Each awarded project gets a shared workspace with the freelancer.',
    target: '[data-tour="active-work"]',
    side: 'top',
    items: ['Inspect what was submitted per milestone', 'Approve to trigger the payout automatically', 'Or request a revision, with your notes'],
  },
  {
    id: 'spending',
    title: 'Track what you have spent',
    body: 'Two records, kept apart on purpose: the payment ledger is what you paid, the blockchain record is what settled on chain.',
    target: '[data-tour="earnings"]',
    side: 'bottom',
    items: ['Spending totals by date range', 'Transactions — the on-chain record', 'Per-contract payment history'],
  },
  {
    id: 'messages',
    title: 'Stay in touch, and get help if it goes wrong',
    body: 'Talk to freelancers before and during a contract, and escalate only if you have to.',
    target: '[data-tour="notifications"]',
    side: 'bottom',
    items: ['Messages — direct chat, per project', 'Notifications — new bids, submitted milestones', 'Disputes — evidence reviewed against on-chain records'],
  },
  {
    id: 'profile',
    title: 'Be an employer people bid for',
    body: 'Freelancers check your history before they spend an evening on a proposal.',
    target: '[data-tour="account"]',
    side: 'bottom',
    items: ['Reputation — built from completed contracts', 'Identity verification — earn the verified badge', 'Saved — freelancers worth coming back to'],
  },
];

/**
 * How much of a phone screen the docked step card takes on a drawer step.
 *
 * Shared with `MobileNav`, which shortens the drawer to end just above it: a
 * drawer sliced off mid-item by the card reads as a bug, not as a spotlight.
 */
export const TOUR_COMPACT_CARD_MAX_HEIGHT = '50dvh';

/** Whether the step at `stepIndex` wants the mobile navigation drawer open. */
export function stepOpensNav(role: UserRole | undefined | null, stepIndex: number): boolean {
  return getTourSteps(role)[stepIndex]?.opensNav === true;
}

export function isTourRole(role: UserRole | undefined | null): role is TourRole {
  return role === 'freelancer' || role === 'employer';
}

export function getTourSteps(role: UserRole | undefined | null): TourStep[] {
  if (role === 'employer') return employerSteps;
  if (role === 'freelancer') return freelancerSteps;
  // Admin has no participant workflow to teach, so there is nothing to run.
  return [];
}

/**
 * Which selector applies at the current width.
 *
 * Below `lg` the sidebar is `hidden`, so a step pointing at it would spotlight a
 * zero-sized rect. Steps that differ carry their own `mobileTarget`.
 */
export function resolveStepTarget(step: TourStep | undefined, isMobile: boolean): string | null {
  if (!step) return null;
  if (isMobile && step.mobileTarget) return step.mobileTarget;
  return step.target ?? null;
}

/**
 * Where a step sits in its role's tour, or 0 when it does not exist.
 *
 * Lets a help affordance drop the reader into the part of the tour that answers
 * their question instead of restarting the whole thing.
 */
export function getStepIndexById(role: UserRole | undefined | null, stepId: string | undefined): number {
  if (!stepId) return 0;
  const index = getTourSteps(role).findIndex((step) => step.id === stepId);
  return index === -1 ? 0 : index;
}

export interface TourProgress {
  completedVersion?: number;
  autoStart?: boolean;
}

export type TourProgressByUser = Record<
  string,
  Partial<Record<TourRole, TourProgress>>
>;

function getTourProgress(
  progressByUser: TourProgressByUser,
  userId: string | undefined | null,
  role: UserRole | undefined | null,
): TourProgress | undefined {
  if (!userId || !isTourRole(role)) return undefined;
  return progressByUser[userId]?.[role];
}

export function isTourCompleted(
  progressByUser: TourProgressByUser,
  userId: string | undefined | null,
  role: UserRole | undefined | null,
): boolean {
  if (!isTourRole(role)) return true;
  return getTourProgress(progressByUser, userId, role)?.completedVersion === TOUR_VERSION;
}

export function getTourAutoStart(
  progressByUser: TourProgressByUser,
  userId: string | undefined | null,
  role: UserRole | undefined | null,
  autoStartByDefault = true,
): boolean {
  if (!userId || !isTourRole(role)) return false;
  return getTourProgress(progressByUser, userId, role)?.autoStart ?? autoStartByDefault;
}

/** `/dashboard/freelancer` and `/dashboard/employer`, trailing slash tolerated. */
export function isDashboardHome(pathname: string | null | undefined, role: UserRole | undefined | null): boolean {
  if (!pathname || !isTourRole(role)) return false;
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return normalized === `/dashboard/${role}`;
}

export interface AutoStartInput {
  /** The tour store has rehydrated from localStorage. */
  hasHydrated: boolean;
  /** The auth store has rehydrated; without this `user` is not trustworthy yet. */
  authHasHydrated: boolean;
  isAuthenticated: boolean;
  userId: string | undefined | null;
  role: UserRole | undefined | null;
  /**
   * `false` means `EmailVerificationGate` is blurring and disabling the whole
   * dashboard. A tour must never run behind it.
   */
  emailVerification: boolean | undefined;
  autoStartByDefault: boolean;
  progressByUser: TourProgressByUser;
  pathname: string | null | undefined;
  isRunning: boolean;
}

export function shouldAutoStartTour(input: AutoStartInput): boolean {
  if (!input.hasHydrated || !input.authHasHydrated) return false;
  if (!input.isAuthenticated) return false;
  if (!input.userId) return false;
  if (!isTourRole(input.role)) return false;
  if (input.emailVerification === false) return false;
  if (!getTourAutoStart(input.progressByUser, input.userId, input.role, input.autoStartByDefault)) return false;
  if (input.isRunning) return false;
  if (isTourCompleted(input.progressByUser, input.userId, input.role)) return false;
  // Only the dashboard home carries the CTA and active-work anchors, and it is
  // the only route the existing e2e suites reach with a seeded participant.
  return isDashboardHome(input.pathname, input.role);
}

export function clampStepIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), total - 1);
}

export function markCompleted(
  progressByUser: TourProgressByUser,
  userId: string | undefined | null,
  role: UserRole | undefined | null,
): TourProgressByUser {
  if (!userId || !isTourRole(role)) return progressByUser;
  return {
    ...progressByUser,
    [userId]: {
      ...progressByUser[userId],
      [role]: {
        ...progressByUser[userId]?.[role],
        completedVersion: TOUR_VERSION,
      },
    },
  };
}

export function setTourAutoStart(
  progressByUser: TourProgressByUser,
  userId: string | undefined | null,
  role: UserRole | undefined | null,
  autoStart: boolean,
): TourProgressByUser {
  if (!userId || !isTourRole(role)) return progressByUser;
  return {
    ...progressByUser,
    [userId]: {
      ...progressByUser[userId],
      [role]: {
        ...progressByUser[userId]?.[role],
        autoStart,
      },
    },
  };
}

/** Announced in the tour's live region, and rendered beside the step dots. */
export function getStepProgressLabel(index: number, total: number): string {
  if (total <= 0) return '';
  return `Step ${clampStepIndex(index, total) + 1} of ${total}`;
}

/* ---------------------------------------------------------------------------
   Geometry.

   The overlay has to measure the target anyway in order to cut the scrim around
   it, so placing the bubble is a few lines more rather than a new dependency.
   Keeping it here means the 320px cases are unit-tested, which is the whole
   point of the exercise -- a floating-UI library's placement cannot be asserted
   in `node --test`.

   Note the bubble only ever floats at `lg` and above. Below that it docks to the
   bottom of the screen, where there is nothing to collide with.
   --------------------------------------------------------------------------- */

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type BubbleSide = 'top' | 'bottom' | 'left' | 'right';

export interface BubblePlacement {
  top: number;
  left: number;
  side: BubbleSide;
  /**
   * The size the bubble must actually render at, never larger than the viewport
   * minus its padding. The caller applies this as a max-width/max-height, which
   * is what makes overflow structurally impossible rather than merely unlikely.
   */
  width: number;
  height: number;
}

/** Distance between the spotlight ring and the bubble. */
export const BUBBLE_GAP = 14;
/** Minimum distance between the bubble and the edge of the viewport. */
export const VIEWPORT_PADDING = 12;

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/** Grows a rect by `pad` on every side, without letting it invert. */
export function expandRect(rect: Rect, pad: number): Rect {
  return {
    top: rect.top - pad,
    left: rect.left - pad,
    width: Math.max(0, rect.width + pad * 2),
    height: Math.max(0, rect.height + pad * 2),
  };
}

export interface SpotlightHole extends Rect {
  /** Corner radius, inherited from the target so the hole traces its shape. */
  radius: number;
}

/**
 * The hole to cut in the scrim for a target.
 *
 * Padded so the highlight breathes, then clamped to the viewport: a target that
 * hangs off the left edge at 320px must not produce a negative-origin rect. The
 * radius is capped at half the shorter side so a pill or a tiny icon button can
 * never invert its own corners.
 */
export function getSpotlightHole(
  target: Rect | null,
  viewport: Size,
  pad: number,
  radius: number,
): SpotlightHole | null {
  if (!isTargetVisible(target, viewport)) return null;

  const padded = expandRect(target as Rect, pad);
  const top = clamp(padded.top, 0, viewport.height);
  const left = clamp(padded.left, 0, viewport.width);
  const bottom = clamp(padded.top + padded.height, 0, viewport.height);
  const right = clamp(padded.left + padded.width, 0, viewport.width);

  const width = right - left;
  const height = bottom - top;
  if (width <= 0 || height <= 0) return null;

  return {
    top,
    left,
    width,
    height,
    radius: Math.max(0, Math.min(radius + pad, width / 2, height / 2)),
  };
}

/** How much room there is between the target and each edge of the viewport. */
function getAvailableSpace(target: Rect, viewport: Size, gap: number, padding: number) {
  return {
    top: target.top - gap - padding,
    bottom: viewport.height - (target.top + target.height) - gap - padding,
    left: target.left - gap - padding,
    right: viewport.width - (target.left + target.width) - gap - padding,
  } satisfies Record<BubbleSide, number>;
}

const OPPOSITE: Record<BubbleSide, BubbleSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/**
 * Picks a side for the bubble and returns viewport-relative coordinates.
 *
 * The preferred side wins when it fits, then its opposite, then whichever of the
 * remaining two has the most room. If nothing fits, the side with the most room
 * is used and the bubble is clamped into the viewport -- overlapping the target
 * is better than being unreachable off-screen.
 */
export function computeBubblePlacement(
  target: Rect,
  bubble: Size,
  viewport: Size,
  preferred: BubbleSide = 'bottom',
  gap: number = BUBBLE_GAP,
  padding: number = VIEWPORT_PADDING,
): BubblePlacement {
  // A bubble can never be wider than the screen it is on. Clamping here rather
  // than trusting the caller is what keeps a 280px-wide device from scrolling
  // sideways, which the responsive e2e contract forbids on every route.
  const size: Size = {
    width: Math.min(bubble.width, Math.max(0, viewport.width - padding * 2)),
    height: Math.min(bubble.height, Math.max(0, viewport.height - padding * 2)),
  };

  const space = getAvailableSpace(target, viewport, gap, padding);
  const needed: Record<BubbleSide, number> = {
    top: size.height,
    bottom: size.height,
    left: size.width,
    right: size.width,
  };

  const others = (['top', 'bottom', 'left', 'right'] as BubbleSide[])
    .filter((side) => side !== preferred && side !== OPPOSITE[preferred])
    .sort((a, b) => space[b] - space[a]);

  const order: BubbleSide[] = [preferred, OPPOSITE[preferred], ...others];
  const side =
    order.find((candidate) => space[candidate] >= needed[candidate]) ??
    order.reduce((best, candidate) => (space[candidate] > space[best] ? candidate : best), order[0]);

  const maxLeft = viewport.width - size.width - padding;
  const maxTop = viewport.height - size.height - padding;

  if (side === 'top' || side === 'bottom') {
    const top = side === 'top' ? target.top - gap - size.height : target.top + target.height + gap;
    // Centre on the target, then pull back inside the viewport.
    const left = target.left + target.width / 2 - size.width / 2;
    return {
      side,
      top: clamp(top, padding, maxTop),
      left: clamp(left, padding, maxLeft),
      width: size.width,
      height: size.height,
    };
  }

  const left = side === 'left' ? target.left - gap - size.width : target.left + target.width + gap;
  const top = target.top + target.height / 2 - size.height / 2;
  return {
    side,
    top: clamp(top, padding, maxTop),
    left: clamp(left, padding, maxLeft),
    width: size.width,
    height: size.height,
  };
}

/** A target is worth spotlighting only if it actually occupies space on screen. */
export function isTargetVisible(rect: Rect | null, viewport: Size): boolean {
  if (!rect) return false;
  if (rect.width <= 0 || rect.height <= 0) return false;
  if (rect.top >= viewport.height || rect.left >= viewport.width) return false;
  if (rect.top + rect.height <= 0 || rect.left + rect.width <= 0) return false;
  return true;
}
