import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getKycReminderStorageKey,
  shouldOfferKycReminder,
} from './first-login-kyc.ts';

const eligible = {
  authHasHydrated: true,
  isAuthenticated: true,
  userId: 'freelancer-1',
  role: 'freelancer',
  emailVerification: true,
  kycStatus: undefined,
  pathname: '/dashboard/freelancer',
  seenThisSession: false,
};

test('offers the KYC reminder to an unstarted participant on dashboard home', () => {
  assert.equal(shouldOfferKycReminder(eligible), true);
  assert.equal(shouldOfferKycReminder({ ...eligible, role: 'employer', pathname: '/dashboard/employer' }), true);
});

test('does not offer the reminder after KYC has been started or approved', () => {
  for (const kycStatus of ['pending', 'in_progress', 'completed', 'approved', 'rejected', 'expired']) {
    assert.equal(shouldOfferKycReminder({ ...eligible, kycStatus }), false, kycStatus);
  }
});

test('does not offer the reminder twice in one login session', () => {
  assert.equal(shouldOfferKycReminder({ ...eligible, seenThisSession: true }), false);
});

test('waits for auth and stays behind the email verification gate', () => {
  assert.equal(shouldOfferKycReminder({ ...eligible, authHasHydrated: false }), false);
  assert.equal(shouldOfferKycReminder({ ...eligible, isAuthenticated: false }), false);
  assert.equal(shouldOfferKycReminder({ ...eligible, emailVerification: false }), false);
});

test('only participant dashboard homes receive the reminder', () => {
  assert.equal(shouldOfferKycReminder({ ...eligible, role: 'admin', pathname: '/dashboard/admin' }), false);
  assert.equal(shouldOfferKycReminder({ ...eligible, pathname: '/dashboard/freelancer/contracts' }), false);
  assert.equal(shouldOfferKycReminder({ ...eligible, userId: undefined }), false);
});

test('session keys are scoped to the user without exposing auth tokens', () => {
  assert.equal(getKycReminderStorageKey('freelancer-1'), 'kyc-reminder-seen:freelancer-1');
});
