// Centralized status presentation for every domain that shows state to a user:
// projects, proposals, contracts, milestones, disputes, refunds, rush upgrades,
// KYC and transactions.
//
// FreelanceXchain is two-sided: a freelancer and an employer looking at the same
// contract must read the same state the same way. That makes this module the
// single source of truth for status tone, label and styling — pages must not
// define their own maps.
//
// All classes are semantic tokens (see globals.css). Every tone pair is verified
// >= 4.5:1 in both themes by `pnpm verify:contrast`.

export type StatusTone = 'success' | 'warning' | 'info' | 'destructive' | 'neutral';

/** Domain scoping disambiguates statuses whose meaning depends on context. */
export type StatusDomain =
  | 'project'
  | 'proposal'
  | 'contract'
  | 'milestone'
  | 'dispute'
  | 'refund'
  | 'rush'
  | 'kyc'
  | 'transaction'
  | 'availability';

export interface StatusDescriptor {
  /** Semantic meaning, independent of theme. */
  tone: StatusTone;
  /** Human-readable label, sentence case. */
  label: string;
  /** Badge classes: subtle fill, toned text, toned border. */
  className: string;
  /** Solid tone swatch, for dots, bars and progress fills. */
  dotClassName: string;
}

const TONE_CLASS: Record<StatusTone, string> = {
  success: 'bg-success-subtle text-success border-success-border',
  warning: 'bg-warning-subtle text-warning border-warning-border',
  info: 'bg-info-subtle text-info border-info-border',
  destructive: 'bg-destructive-subtle text-destructive border-destructive-border',
  neutral: 'bg-neutral-subtle text-neutral border-neutral-border',
};

const TONE_DOT_CLASS: Record<StatusTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  destructive: 'bg-destructive',
  neutral: 'bg-neutral',
};

// Default tone per status. Values that mean the same thing across domains share
// one tone regardless of which entity they describe.
const STATUS_TONE: Record<string, StatusTone> = {
  // Terminal success
  completed: 'success',
  approved: 'success',
  accepted: 'success',
  resolved: 'success',
  released: 'success',
  paid: 'success',
  verified: 'success',
  success: 'success',

  // Healthy ongoing
  active: 'success',
  available: 'success',
  funded: 'success',

  // Awaiting someone
  pending: 'warning',
  submitted: 'warning',
  under_review: 'warning',
  in_review: 'warning',
  awaiting_funding: 'warning',
  busy: 'warning',
  counter_offered: 'warning',
  requested: 'warning',
  action_required: 'warning',

  // Transitional / informational
  in_progress: 'info',
  releasing: 'info',
  processing: 'info',
  funding: 'info',
  open: 'success',

  // Terminal negative
  cancelled: 'destructive',
  rejected: 'destructive',
  declined: 'destructive',
  disputed: 'destructive',
  withdrawn: 'destructive',
  expired: 'destructive',
  failed: 'destructive',
  failure: 'destructive',
  unhealthy: 'destructive',

  // Terminal, neither good nor bad
  refunded: 'neutral',
  draft: 'neutral',
  unavailable: 'neutral',
  archived: 'neutral',
  inactive: 'neutral',
};

// Statuses whose tone genuinely changes with context. Everything not listed here
// resolves identically in every domain, which is the point.
const DOMAIN_OVERRIDES: Partial<Record<StatusDomain, Record<string, StatusTone>>> = {
  // An open dispute is an unresolved problem, not a healthy state — the shared
  // default (`open` = success, correct for a project accepting proposals) would
  // read as reassuring on exactly the screen where it must not.
  dispute: {
    open: 'warning',
  },
  // A refund the employer requested is pending money movement, not a neutral
  // archive entry.
  refund: {
    refunded: 'success',
  },
  // KYC never "succeeds" until approved; in_progress is a blocking state for the
  // user, so it warrants attention rather than plain information.
  kyc: {
    in_progress: 'warning',
  },
};

const LABEL_OVERRIDES: Record<string, string> = {
  in_progress: 'In progress',
  under_review: 'Under review',
  in_review: 'In review',
  counter_offered: 'Counter-offered',
  awaiting_funding: 'Awaiting funding',
  action_required: 'Action required',
  kyc_pending: 'KYC pending',
};

/** Turns a raw backend status into a sentence-case label. */
export function formatStatusLabel(status: string): string {
  if (!status) return 'Unknown';
  const key = status.toLowerCase();
  if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key];
  const spaced = key.replace(/[_-]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Resolves the semantic tone for a status, refined by domain where it matters. */
export function getStatusTone(status: string, domain?: StatusDomain): StatusTone {
  const key = (status ?? '').toLowerCase();
  const override = domain ? DOMAIN_OVERRIDES[domain]?.[key] : undefined;
  return override ?? STATUS_TONE[key] ?? 'neutral';
}

/** Full presentation descriptor. Prefer this over the class-string helpers. */
export function getStatusDescriptor(status: string, domain?: StatusDomain): StatusDescriptor {
  const tone = getStatusTone(status, domain);
  return {
    tone,
    label: formatStatusLabel(status),
    className: TONE_CLASS[tone],
    dotClassName: TONE_DOT_CLASS[tone],
  };
}

/**
 * Badge classes for a status.
 * @deprecated Prefer `<StatusBadge status={...} />`, which also supplies the label.
 */
export function getStatusColor(status: string, domain?: StatusDomain): string {
  return getStatusDescriptor(status, domain).className;
}

/** Solid tone class, for dots, meters and progress fills. */
export function getStatusDotColor(status: string, domain?: StatusDomain): string {
  return getStatusDescriptor(status, domain).dotClassName;
}

/** Classes for an arbitrary tone, when the tone is known but no status exists. */
export function getToneClass(tone: StatusTone): string {
  return TONE_CLASS[tone];
}
