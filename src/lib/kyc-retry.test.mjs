import assert from 'node:assert/strict';
import test from 'node:test';

import { getKycRetryAvailability } from './kyc-retry.ts';

const verification = { status: 'rejected', created_at: '2026-08-06T00:00:00.000Z' };

test('shows the backend 24-hour KYC retry cooldown', () => {
  assert.deepEqual(getKycRetryAvailability(verification, new Date('2026-08-06T12:00:00.000Z')), {
    canRetry: false,
    retryAt: '2026-08-07T00:00:00.000Z',
    hoursRemaining: 12,
  });
  assert.deepEqual(getKycRetryAvailability(verification, new Date('2026-08-07T00:00:00.000Z')), {
    canRetry: true,
    retryAt: '2026-08-07T00:00:00.000Z',
    hoursRemaining: 0,
  });
});

test('does not offer retries for active or approved verification states', () => {
  assert.equal(getKycRetryAvailability({ ...verification, status: 'pending' }, new Date('2026-08-08T00:00:00.000Z')), null);
  assert.equal(getKycRetryAvailability({ ...verification, status: 'approved' }, new Date('2026-08-08T00:00:00.000Z')), null);
});
