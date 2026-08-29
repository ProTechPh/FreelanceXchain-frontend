// Shared value formatting.
//
// Amounts are the most trust-sensitive thing on this platform — escrow balances,
// milestone values, payouts and refunds — and they were previously formatted with
// bare `toLocaleString()` at ~58 call sites. That has two problems: it renders no
// currency, and it resolves against the ambient locale, which can differ between
// the Next.js server and the browser and produce a hydration mismatch. Every
// helper here pins an explicit locale so server and client always agree.

const LOCALE = 'en-US';

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: string, fractionDigits: number): Intl.NumberFormat {
  const key = `${currency}:${fractionDigits}`;
  let formatter = currencyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    currencyFormatters.set(key, formatter);
  }
  return formatter;
}

export interface AmountOptions {
  currency?: string;
  /** Force decimals. Defaults to 2 for fractional values, 0 for whole ones. */
  fractionDigits?: number;
}

/**
 * Formats a monetary amount. Whole values render without cents ($1,200) and
 * fractional ones keep them ($1,200.50), so dense tables stay readable without
 * ever truncating a real cent value.
 */
export function formatAmount(value: number | string | null | undefined, options: AmountOptions = {}): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  if (amount == null || !Number.isFinite(amount)) return '—';
  const { currency = 'USD' } = options;
  const fractionDigits = options.fractionDigits ?? (Number.isInteger(amount) ? 0 : 2);
  return currencyFormatter(currency, fractionDigits).format(amount);
}

/** Compact form for KPI tiles and charts: $1.2K, $3.4M. */
export function formatAmountCompact(value: number | null | undefined, currency = 'USD'): string {
  if (value == null || !Number.isFinite(value)) return '—';
  if (Math.abs(value) < 1000) return formatAmount(value, { currency });
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/** Plain number with thousands separators. */
export function formatNumber(value: number | null | undefined, fractionDigits = 0): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Ratings and scores: one decimal, never "4.0" collapsed to "4". */
export function formatScore(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toFixed(1);
}

/** Percentage from an already-scaled value (12.5 -> "12.5%"). */
export function formatPercent(value: number | null | undefined, fractionDigits = 0): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${formatNumber(value, fractionDigits)}%`;
}

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date only: "Aug 25, 2026". */
export function formatDate(value: string | number | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' }).format(date);
}

/** Date and time: "Aug 25, 2026, 10:14 PM". */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

/**
 * Relative time: "3 days ago", "in 2 hours".
 * Pass `now` explicitly when rendering on the server so output stays stable.
 */
export function formatRelativeTime(
  value: string | number | Date | null | undefined,
  now: Date = new Date(),
): string {
  const date = toDate(value);
  if (!date) return '—';
  const seconds = (date.getTime() - now.getTime()) / 1000;
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(seconds) >= secondsInUnit) {
      return rtf.format(Math.round(seconds / secondsInUnit), unit);
    }
  }
  return rtf.format(Math.round(seconds), 'second');
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  'auth.login': 'User Login',
  'auth.login_failed': 'Failed Login Attempt',
  'auth.logout': 'User Logout',
  'auth.register': 'User Registration',
  'auth.password_update': 'Password Updated',
  'auth.password_reset': 'Password Reset',
  'auth.mfa_enroll': 'MFA Enrolled',
  'auth.mfa_verify': 'MFA Verified',
  'kyc.approve': 'KYC Approved',
  'kyc.reject': 'KYC Rejected',
  'dispute.resolve': 'Dispute Resolved',
  'dispute.verify_evidence': 'Evidence Verified',
  'skill.create': 'Skill Created',
  'skill.approve': 'Skill Approved',
  'skill.reject': 'Skill Rejected',
  'user.suspend': 'User Suspended',
  'user.unsuspend': 'User Unsuspended',
  'contract.force_release': 'Milestone Force Release',
  'contract.emergency_refund': 'Emergency Escrow Refund',
  'escrow.refund_review': 'Escrow Refund Review',
  'system.health_check': 'System Health Check',
  'system.maintenance': 'System Maintenance',
};

const AUDIT_RESOURCE_LABELS: Record<string, string> = {
  kyc_verification: 'KYC Verification',
  dispute_evidence: 'Dispute Evidence',
  contract: 'Contract',
  taxonomy: 'Skill Taxonomy',
  skill: 'Skill',
  user: 'User Account',
  dispute: 'Dispute',
  system: 'System',
  escrow: 'Escrow',
};

/**
 * Converts dot-and-underscore variable action names (e.g. `escrow.refund_review`, `kyc.reject`)
 * into clean, user-friendly labels (e.g. "Escrow Refund Review", "KYC Rejected").
 */
export function formatAuditAction(action: string | null | undefined): string {
  if (!action) return '—';
  if (AUDIT_ACTION_LABELS[action]) return AUDIT_ACTION_LABELS[action];

  if (action.includes('.')) {
    const parts = action.split('.');
    const category = parts[0]!.toUpperCase() === 'KYC' ? 'KYC' : parts[0]!.charAt(0).toUpperCase() + parts[0]!.slice(1);
    const rest = parts.slice(1).join(' ').replace(/[._-]/g, ' ');
    const formattedRest = rest.replace(/\b\w/g, (c) => c.toUpperCase());
    return `${category}: ${formattedRest}`;
  }

  return action.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Converts underscored resource names (e.g. `kyc_verification`, `dispute_evidence`)
 * into clean labels (e.g. "KYC Verification", "Dispute Evidence").
 */
export function formatAuditResource(resourceType: string | null | undefined): string {
  if (!resourceType) return '—';
  if (AUDIT_RESOURCE_LABELS[resourceType]) return AUDIT_RESOURCE_LABELS[resourceType];
  return resourceType.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
