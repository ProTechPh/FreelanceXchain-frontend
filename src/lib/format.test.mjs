import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatAmount,
  formatAmountCompact,
  formatNumber,
  formatScore,
  formatPercent,
  formatDate,
  formatRelativeTime,
  formatGroupedNumberInput,
  parseGroupedNumber,
} from './format.ts';

test('formatAmount drops cents for whole values and keeps them otherwise', () => {
  assert.equal(formatAmount(1200), '₱1,200');
  assert.equal(formatAmount(1200.5), '₱1,200.50');
  assert.equal(formatAmount(0), '₱0');
});

test('formatAmount formats crypto currencies with currency ticker', () => {
  assert.match(formatAmount(2, { currency: 'ETH' }), /ETH\s*2/);
  assert.match(formatAmount(0.5, { currency: 'ETH', fractionDigits: 4 }), /ETH\s*0\.5000/);
  assert.match(formatAmount(1.25, { currency: 'ETH', fractionDigits: 2 }), /ETH\s*1\.25/);
  assert.match(formatAmount(0.1534, { currency: 'ETH' }), /ETH\s*0\.1534/);
  assert.match(formatAmount(0.15, { currency: 'ETH' }), /ETH\s*0\.15$/);
  assert.match(formatAmount(0.375, { currency: 'ETH' }), /ETH\s*0\.375/);
  assert.match(formatAmount(0.123456, { currency: 'ETH' }), /ETH\s*0\.1235/);
});

test('formatAmount still supports explicit USD when requested', () => {
  assert.equal(formatAmount(1200, { currency: 'USD' }), '$1,200');
});

test('formatAmount accepts numeric strings from the API', () => {
  assert.equal(formatAmount('2500'), '₱2,500');
});

test('formatAmount renders a dash rather than NaN for missing values', () => {
  assert.equal(formatAmount(null), '—');
  assert.equal(formatAmount(undefined), '—');
  assert.equal(formatAmount('not-a-number'), '—');
});

test('formatAmount honours an explicit fraction count', () => {
  assert.equal(formatAmount(1200, { fractionDigits: 2 }), '₱1,200.00');
});

test('formatAmountCompact abbreviates only above a thousand', () => {
  assert.equal(formatAmountCompact(999), '₱999');
  assert.equal(formatAmountCompact(1200), '₱1.2K');
  assert.equal(formatAmountCompact(3_400_000), '₱3.4M');
});

test('number, score and percent helpers', () => {
  assert.equal(formatNumber(1234567), '1,234,567');
  assert.equal(formatScore(4), '4.0');
  assert.equal(formatPercent(12.5, 1), '12.5%');
});

test('date helpers reject invalid input instead of printing "Invalid Date"', () => {
  assert.equal(formatDate('nonsense'), '—');
  assert.equal(formatDate(null), '—');
});

test('formatRelativeTime is deterministic when given an explicit now', () => {
  const now = new Date('2026-08-25T12:00:00Z');
  assert.equal(formatRelativeTime('2026-08-22T12:00:00Z', now), '3 days ago');
  assert.equal(formatRelativeTime('2026-08-25T14:00:00Z', now), 'in 2 hours');
});

test('formatAuditAction converts variable names to human-readable labels', async () => {
  const { formatAuditAction, formatAuditResource } = await import('./format.ts');
  assert.equal(formatAuditAction('auth.login'), 'User Login');
  assert.equal(formatAuditAction('auth.login_failed'), 'Failed Login Attempt');
  assert.equal(formatAuditAction('escrow.refund_review'), 'Escrow Refund Review');
  assert.equal(formatAuditAction('kyc.reject'), 'KYC Rejected');
  assert.equal(formatAuditAction('contract.force_release'), 'Milestone Force Release');
  assert.equal(formatAuditAction('custom.custom_action'), 'Custom: Custom Action');
  assert.equal(formatAuditAction(null), '—');

  assert.equal(formatAuditResource('kyc_verification'), 'KYC Verification');
  assert.equal(formatAuditResource('dispute_evidence'), 'Dispute Evidence');
  assert.equal(formatAuditResource('contract'), 'Contract');
  assert.equal(formatAuditResource('unknown_resource_type'), 'Unknown Resource Type');
});


test('formats typed peso amounts with comma separators', () => {
  const text = (raw) => formatGroupedNumberInput(raw).text;
  assert.equal(text('20000'), '20,000');
  assert.equal(text('1234567.5'), '1,234,567.5');
  assert.equal(text('20,0000'), '200,000');
  assert.equal(text('9933.'), '9,933.');
  assert.equal(text('99.999'), '99.99');
  assert.equal(text('0012'), '12');
  assert.equal(text('1.2.3'), '1.23');
  assert.equal(text('abc'), '');
  assert.equal(text('500'), '500');
});

test('keeps the caret after the same digit when commas are added or removed', () => {
  // Typing a 5th digit at the end: "2000|" + "0" → "20,000|"
  assert.deepEqual(formatGroupedNumberInput('20000', 5), { text: '20,000', caret: 6 });
  // Inserting "5" after the first digit of "1,000": "15,000" with caret after the 5
  assert.deepEqual(formatGroupedNumberInput('15,000', 2), { text: '15,000', caret: 2 });
  // Deleting a digit: "12,34|5" → "1,234|5" keeps the caret before the 5
  assert.deepEqual(formatGroupedNumberInput('12,345'.replace('3', ''), 4), { text: '1,245', caret: 4 });
  assert.deepEqual(formatGroupedNumberInput('', 0), { text: '', caret: 0 });
});

test('parses comma-separated amounts', () => {
  assert.equal(parseGroupedNumber('20,000'), 20000);
  assert.equal(parseGroupedNumber('1,234.56'), 1234.56);
  assert.ok(Number.isNaN(parseGroupedNumber('')));
});
