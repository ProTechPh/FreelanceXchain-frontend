/**
 * Price presentation for the Pro plan.
 *
 * Amounts arrive from Stripe in minor units, so the formatting and the
 * annual-saving arithmetic live here where they can be tested — a pricing page
 * that quietly rounds the wrong way is worse than one with no prices at all.
 *
 * No React and no `@/…` runtime imports: this runs under `node --test`.
 */

import type { BillingInterval, PlanPrice } from '@/types';

/** Format minor units as currency, dropping ".00" on whole amounts. */
export function formatPrice(unitAmount: number | null, currency: string | null): string | null {
  if (unitAmount === null || currency === null) return null;

  const major = unitAmount / 100;
  const hasCents = unitAmount % 100 !== 0;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: hasCents ? 2 : 0,
    }).format(major);
  } catch {
    // An unknown currency code should degrade, not throw on a public page.
    return `${major} ${currency.toUpperCase()}`;
  }
}

export function findPrice(prices: readonly PlanPrice[], interval: BillingInterval): PlanPrice | undefined {
  return prices.find((price) => price.interval === interval);
}

export interface AnnualSaving {
  /** Minor units saved per year by paying annually. */
  amount: number;
  percent: number;
  currency: string;
  /** Whole months of the monthly rate covered by the saving, floored. */
  freeMonths: number;
}

/**
 * What switching to annual actually saves.
 *
 * Returns null unless both prices exist in the same currency and annual is
 * genuinely cheaper — claiming a saving that is zero or negative would be a
 * lie, and mixed currencies cannot be compared at all.
 */
export function computeAnnualSaving(prices: readonly PlanPrice[]): AnnualSaving | null {
  const monthly = findPrice(prices, 'month');
  const annual = findPrice(prices, 'year');

  if (!monthly?.unitAmount || !annual?.unitAmount) return null;
  if (!monthly.currency || !annual.currency) return null;
  if (monthly.currency !== annual.currency) return null;

  const yearlyAtMonthlyRate = monthly.unitAmount * 12;
  const amount = yearlyAtMonthlyRate - annual.unitAmount;
  if (amount <= 0) return null;

  return {
    amount,
    percent: Math.round((amount / yearlyAtMonthlyRate) * 100),
    currency: annual.currency,
    freeMonths: Math.floor(amount / monthly.unitAmount),
  };
}

/** "$20 / month" or "$200 / year", or null when the amount is unknown. */
export function priceLabel(price: PlanPrice | undefined): string | null {
  if (!price) return null;
  const formatted = formatPrice(price.unitAmount, price.currency);
  return formatted === null ? null : `${formatted} / ${price.interval}`;
}

/**
 * What an annual plan works out to per month — the comparison people actually
 * make when choosing between the two.
 */
export function monthlyEquivalent(annual: PlanPrice | undefined): string | null {
  if (!annual?.unitAmount || !annual.currency) return null;
  return formatPrice(Math.round(annual.unitAmount / 12), annual.currency);
}
