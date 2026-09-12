import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasProAccess,
  resolvePlan,
  isPlanUpgradeRequired,
  PLAN_UPGRADE_ERROR_CODE,
} from './plan-access.ts';

const httpError = (status, data) => ({ response: { status, data } });

test('an admin has Pro access without any plan field', () => {
  // Staff operate the platform and are never billed for it. This is the
  // regression guard for admins hitting a paywall on their own dashboards.
  assert.equal(hasProAccess({ role: 'admin' }), true);
  assert.equal(hasProAccess({ role: 'admin', plan: 'free' }), true);
});

test('a subscribed participant has Pro access', () => {
  assert.equal(hasProAccess({ role: 'freelancer', plan: 'pro' }), true);
  assert.equal(hasProAccess({ role: 'employer', plan: 'pro' }), true);
});

test('an unsubscribed participant does not', () => {
  assert.equal(hasProAccess({ role: 'freelancer', plan: 'free' }), false);
  assert.equal(hasProAccess({ role: 'employer' }), false);
});

test('a missing user is never entitled', () => {
  assert.equal(hasProAccess(null), false);
  assert.equal(hasProAccess(undefined), false);
});

test('resolvePlan defaults to free when the API has not said yet', () => {
  // An older API build, or a persisted user from before this feature shipped.
  assert.equal(resolvePlan({ role: 'freelancer' }), 'free');
  assert.equal(resolvePlan(null), 'free');
  assert.equal(resolvePlan({ role: 'freelancer', plan: 'pro' }), 'pro');
});

test('recognises the upgrade error in every body shape the API might use', () => {
  assert.equal(isPlanUpgradeRequired(httpError(403, { code: PLAN_UPGRADE_ERROR_CODE })), true);
  assert.equal(isPlanUpgradeRequired(httpError(403, { error: PLAN_UPGRADE_ERROR_CODE })), true);
  assert.equal(
    isPlanUpgradeRequired(httpError(403, { error: { code: PLAN_UPGRADE_ERROR_CODE } })),
    true,
  );
});

test('does not mistake an ordinary 403 for a paywall', () => {
  // Showing "upgrade to Pro" on a genuine permission error would be a lie.
  assert.equal(isPlanUpgradeRequired(httpError(403, { error: { code: 'AUTH_FORBIDDEN' } })), false);
  assert.equal(isPlanUpgradeRequired(httpError(403, {})), false);
  assert.equal(isPlanUpgradeRequired(httpError(403, undefined)), false);
});

test('ignores the code on a non-403 status', () => {
  assert.equal(isPlanUpgradeRequired(httpError(402, { code: PLAN_UPGRADE_ERROR_CODE })), false);
  assert.equal(isPlanUpgradeRequired(httpError(401, { code: PLAN_UPGRADE_ERROR_CODE })), false);
});

test('survives a network error with no response at all', () => {
  assert.equal(isPlanUpgradeRequired(new Error('Network Error')), false);
  assert.equal(isPlanUpgradeRequired(null), false);
  assert.equal(isPlanUpgradeRequired(undefined), false);
});
