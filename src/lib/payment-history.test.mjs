import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PAYMENT_TYPE_LABELS,
  getPaymentTypeLabel,
  getPaymentDirection,
  summarizePaymentHistory,
} from './payment-history.ts';

const record = (overrides = {}) => ({
  id: 'p1',
  milestoneId: null,
  payerId: 'employer-1',
  payeeId: 'freelancer-1',
  amount: 1,
  currency: 'ETH',
  txHash: null,
  status: 'completed',
  paymentType: 'milestone_release',
  createdAt: '2026-08-01T00:00:00.000Z',
  ...overrides,
});

test('labels every payment type the API can return', () => {
  assert.deepEqual(Object.keys(PAYMENT_TYPE_LABELS).sort(), [
    'dispute_resolution',
    'escrow_deposit',
    'milestone_release',
    'refund',
    'rush_fee',
  ]);
  assert.equal(getPaymentTypeLabel('escrow_deposit'), 'Escrow deposit');
});

test('falls back to the raw value for an unknown payment type', () => {
  assert.equal(getPaymentTypeLabel('some_new_type'), 'some_new_type');
});

test('direction is relative to the viewer', () => {
  const r = record();
  assert.equal(getPaymentDirection(r, 'freelancer-1'), 'in');
  assert.equal(getPaymentDirection(r, 'employer-1'), 'out');
});

test('a viewer who is neither party gets none, not a misleading out', () => {
  assert.equal(getPaymentDirection(record(), 'admin-9'), 'none');
});

test('summary counts only completed payments toward the money totals', () => {
  const summary = summarizePaymentHistory(
    [
      record({ id: 'a', amount: 3, status: 'completed' }),
      record({ id: 'b', amount: 100, status: 'pending' }),
      record({ id: 'c', amount: 50, status: 'failed' }),
    ],
    'freelancer-1',
  );
  assert.equal(summary.totalIn, 3);
  assert.equal(summary.totalOut, 0);
  assert.equal(summary.net, 3);
});

test('summary counts every row by type regardless of status', () => {
  const summary = summarizePaymentHistory(
    [
      record({ id: 'a', paymentType: 'escrow_deposit', status: 'pending' }),
      record({ id: 'b', paymentType: 'escrow_deposit', status: 'completed' }),
      record({ id: 'c', paymentType: 'rush_fee', status: 'completed' }),
    ],
    'freelancer-1',
  );
  assert.deepEqual(summary.byType, { escrow_deposit: 2, rush_fee: 1 });
});

test('summary nets inbound against outbound for the same viewer', () => {
  const summary = summarizePaymentHistory(
    [
      record({ id: 'a', amount: 5, payeeId: 'u1', payerId: 'u2' }),
      record({ id: 'b', amount: 2, payeeId: 'u2', payerId: 'u1' }),
    ],
    'u1',
  );
  assert.equal(summary.totalIn, 5);
  assert.equal(summary.totalOut, 2);
  assert.equal(summary.net, 3);
});

test('empty ledger summarizes to zeroes, not NaN', () => {
  assert.deepEqual(summarizePaymentHistory([], 'u1'), {
    totalIn: 0,
    totalOut: 0,
    net: 0,
    byType: {},
  });
});
