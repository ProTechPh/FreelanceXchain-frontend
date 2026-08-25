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
