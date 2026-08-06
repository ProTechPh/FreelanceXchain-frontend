import assert from 'node:assert/strict';
import test from 'node:test';

import { getSignedTransactionAmount, getTransactionDetailRoute, parseTransactionMetadata } from './transaction-view.ts';

const transaction = {
  id: 'transaction-1',
  from_user_id: 'employer-1',
  to_user_id: 'freelancer-1',
  amount: 500,
  type: 'escrow_release',
  status: 'completed',
  created_at: '2026-08-06T00:00:00.000Z',
  updated_at: '2026-08-06T00:00:00.000Z',
};

test('signs incoming and outgoing transaction amounts for the viewer', () => {
  assert.equal(getSignedTransactionAmount(transaction, 'freelancer-1'), 500);
  assert.equal(getSignedTransactionAmount(transaction, 'employer-1'), -500);
  assert.equal(getSignedTransactionAmount(transaction, 'someone-else'), 0);
});

test('parses transaction metadata safely', () => {
  assert.deepEqual(parseTransactionMetadata('{"network":"sepolia"}'), { network: 'sepolia' });
  assert.deepEqual(parseTransactionMetadata('not-json'), { value: 'not-json' });
  assert.deepEqual(parseTransactionMetadata({ release: true }), { release: true });
});

test('builds role-scoped transaction detail routes', () => {
  assert.equal(getTransactionDetailRoute('employer', 'transaction-1'), '/dashboard/employer/transactions/transaction-1');
  assert.equal(getTransactionDetailRoute('freelancer', 'transaction-1'), '/dashboard/freelancer/transactions/transaction-1');
});
