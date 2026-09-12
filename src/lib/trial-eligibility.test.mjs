import assert from 'node:assert/strict';
import test from 'node:test';
import { describeTrialIneligibility } from './trial-eligibility.ts';

test('explains an unverified email and points at the fix', () => {
  const notice = describeTrialIneligibility('email_unverified', 'freelancer');
  assert.match(notice.message, /verify your email/i);
  assert.equal(notice.actionHref, '/dashboard/freelancer/settings');
});

test('does not offer a paid path when verification is the blocker', () => {
  // Verification gates the purchase itself, so telling the user they can
  // "subscribe now either way" would be false.
  for (const reason of ['email_unverified', 'kyc_unverified']) {
    assert.doesNotMatch(describeTrialIneligibility(reason, 'freelancer').message, /subscribe now/i);
  }
});

test('explains missing identity verification and points at the fix', () => {
  const notice = describeTrialIneligibility('kyc_unverified', 'employer');
  assert.match(notice.message, /identity verification/i);
  assert.equal(notice.actionHref, '/dashboard/employer/verification');
});

test('says a trial was already used, with no action to take', () => {
  const notice = describeTrialIneligibility('trial_already_used', 'freelancer');
  assert.match(notice.message, /already used/i);
  assert.equal(notice.actionHref, undefined);
});

test('every blocking reason names an action the user can take', () => {
  for (const reason of ['email_unverified', 'kyc_unverified']) {
    const notice = describeTrialIneligibility(reason, 'freelancer');
    assert.ok(notice.actionHref, `${reason} should link to the fix`);
    assert.ok(notice.actionLabel);
  }
});

test('stays silent when no trial is on offer', () => {
  // Never advertise the absence of something the user was not promised.
  assert.equal(describeTrialIneligibility('no_trial_offered', 'freelancer'), null);
  assert.equal(describeTrialIneligibility(null, 'freelancer'), null);
  assert.equal(describeTrialIneligibility(undefined, 'freelancer'), null);
});

test('falls back to a freelancer path when the role is unknown', () => {
  assert.equal(describeTrialIneligibility('email_unverified', undefined).actionHref,
    '/dashboard/freelancer/settings');
});
