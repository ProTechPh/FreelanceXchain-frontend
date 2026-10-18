import assert from 'node:assert/strict';
import test from 'node:test';
import { getLifecycleStepIndex, getNextAction, getFundingCountdown, isPreWorkStatus, NEXT_ACTION_COPY, LIFECYCLE_STEPS } from './contract-lifecycle.ts';

test('maps statuses to lifecycle steps', () => {
  assert.equal(getLifecycleStepIndex('negotiating'), 0);
  assert.equal(getLifecycleStepIndex('awaiting_signatures'), 1);
  assert.equal(getLifecycleStepIndex('awaiting_funding'), 2);
  assert.equal(getLifecycleStepIndex('pending'), 2);
  assert.equal(getLifecycleStepIndex('active'), 3);
  assert.equal(getLifecycleStepIndex('disputed'), 3);
  assert.equal(getLifecycleStepIndex('completed'), LIFECYCLE_STEPS.length);
  assert.equal(getLifecycleStepIndex('cancelled'), -1);
});

test('next action during negotiation, signing and funding', () => {
  assert.equal(getNextAction({ status: 'negotiating', role: 'freelancer', permissions: { canAccept: true, canPropose: true }, hasOpenOffer: true }), 'respond_to_offer');
  assert.equal(getNextAction({ status: 'negotiating', role: 'employer', permissions: { canAccept: false, canPropose: true }, hasOpenOffer: true }), 'waiting_on_counterparty');
  assert.equal(getNextAction({ status: 'negotiating', role: 'employer', permissions: { canAccept: false, canPropose: true }, hasOpenOffer: false }), 'propose_terms');
  assert.equal(getNextAction({ status: 'negotiating', role: 'employer' }), 'waiting_on_counterparty');
  assert.equal(getNextAction({ status: 'awaiting_signatures', role: 'freelancer', nextSigner: 'freelancer' }), 'sign');
  assert.equal(getNextAction({ status: 'awaiting_signatures', role: 'employer', nextSigner: 'freelancer' }), 'waiting_for_freelancer_signature');
  assert.equal(getNextAction({ status: 'awaiting_signatures', role: 'freelancer', nextSigner: 'employer' }), 'waiting_for_employer_signature');
  assert.equal(getNextAction({ status: 'awaiting_signatures', role: 'freelancer', nextSigner: null }), 'none');
  assert.equal(getNextAction({ status: 'awaiting_funding', role: 'employer' }), 'fund');
  assert.equal(getNextAction({ status: 'awaiting_funding', role: 'freelancer' }), 'waiting_for_funding');
  assert.equal(getNextAction({ status: 'active', role: 'freelancer' }), 'none');
  assert.equal(NEXT_ACTION_COPY.fund, 'Fund the escrow');
  assert.equal(isPreWorkStatus('awaiting_funding'), true);
  assert.equal(isPreWorkStatus('active'), false);
});

test('funding countdown formatting', () => {
  const now = new Date('2026-10-19T00:00:00Z');
  assert.equal(getFundingCountdown(null, now), null);
  assert.equal(getFundingCountdown('bad', now), null);
  assert.deepEqual(getFundingCountdown('2026-10-18T00:00:00Z', now), { expired: true, urgent: true, label: 'Funding deadline passed', msRemaining: 0 });
  const long = getFundingCountdown('2026-10-21T05:00:00Z', now);
  assert.equal(long.label, '2d 5h left to fund');
  assert.equal(long.urgent, false);
  const short = getFundingCountdown('2026-10-19T03:30:00Z', now);
  assert.equal(short.label, '3h 30m left to fund');
  assert.equal(short.urgent, true);
  assert.equal(getFundingCountdown('2026-10-19T00:00:20Z', now).label, '1m left to fund');
});
