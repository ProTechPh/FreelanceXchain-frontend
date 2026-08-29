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
} from './format.ts';

test('formatAmount drops cents for whole values and keeps them otherwise', () => {
  assert.equal(formatAmount(1200), '$1,200');
  assert.equal(formatAmount(1200.5), '$1,200.50');
  assert.equal(formatAmount(0), '$0');
});

test('formatAmount accepts numeric strings from the API', () => {
  assert.equal(formatAmount('2500'), '$2,500');
});

test('formatAmount renders a dash rather than NaN for missing values', () => {
  assert.equal(formatAmount(null), '—');
  assert.equal(formatAmount(undefined), '—');
  assert.equal(formatAmount('not-a-number'), '—');
});

test('formatAmount honours an explicit fraction count', () => {
  assert.equal(formatAmount(1200, { fractionDigits: 2 }), '$1,200.00');
});

test('formatAmountCompact abbreviates only above a thousand', () => {
  assert.equal(formatAmountCompact(999), '$999');
  assert.equal(formatAmountCompact(1200), '$1.2K');
  assert.equal(formatAmountCompact(3_400_000), '$3.4M');
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

