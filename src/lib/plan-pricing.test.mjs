import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatPrice,
  findPrice,
  computeAnnualSaving,
  priceLabel,
  monthlyEquivalent,
} from './plan-pricing.ts';

// The real configured prices: $20/month and $200/year.
const MONTHLY = { interval: 'month', priceId: 'price_m', unitAmount: 2000, currency: 'usd' };
const ANNUAL = { interval: 'year', priceId: 'price_y', unitAmount: 20000, currency: 'usd' };

test('formats whole amounts without stray cents', () => {
  assert.equal(formatPrice(2000, 'usd'), '$20');
  assert.equal(formatPrice(20000, 'usd'), '$200');
});

test('keeps cents when the amount actually has them', () => {
  assert.equal(formatPrice(1999, 'usd'), '$19.99');
});

test('returns null rather than guessing when Stripe could not be read', () => {
  assert.equal(formatPrice(null, 'usd'), null);
  assert.equal(formatPrice(2000, null), null);
});

test('degrades instead of throwing on an unknown currency', () => {
  // A public pricing page must not blow up on a currency Intl does not know.
  assert.ok(formatPrice(2000, 'zzz'));
});

test('computes the real annual saving', () => {
  const saving = computeAnnualSaving([MONTHLY, ANNUAL]);
  // $20 x 12 = $240 vs $200 → $40 saved, 17%, 2 free months.
  assert.equal(saving.amount, 4000);
  assert.equal(saving.percent, 17);
  assert.equal(saving.freeMonths, 2);
  assert.equal(saving.currency, 'usd');
});

test('claims no saving when annual is not actually cheaper', () => {
  const sameRate = { ...ANNUAL, unitAmount: 24000 };
  assert.equal(computeAnnualSaving([MONTHLY, sameRate]), null);

  const worse = { ...ANNUAL, unitAmount: 30000 };
  assert.equal(computeAnnualSaving([MONTHLY, worse]), null);
});

test('refuses to compare prices in different currencies', () => {
  const eurAnnual = { ...ANNUAL, currency: 'eur' };
  assert.equal(computeAnnualSaving([MONTHLY, eurAnnual]), null);
});

test('claims no saving when a price is missing or unknown', () => {
  assert.equal(computeAnnualSaving([MONTHLY]), null);
  assert.equal(computeAnnualSaving([MONTHLY, { ...ANNUAL, unitAmount: null }]), null);
  assert.equal(computeAnnualSaving([]), null);
});

test('labels a price by its interval', () => {
  assert.equal(priceLabel(MONTHLY), '$20 / month');
  assert.equal(priceLabel(ANNUAL), '$200 / year');
  assert.equal(priceLabel(undefined), null);
  assert.equal(priceLabel({ ...MONTHLY, unitAmount: null }), null);
});

test('shows what annual works out to per month', () => {
  assert.equal(monthlyEquivalent(ANNUAL), '$16.67');
  assert.equal(monthlyEquivalent(undefined), null);
});

test('finds a price by interval', () => {
  assert.equal(findPrice([MONTHLY, ANNUAL], 'year').priceId, 'price_y');
  assert.equal(findPrice([MONTHLY], 'year'), undefined);
});
