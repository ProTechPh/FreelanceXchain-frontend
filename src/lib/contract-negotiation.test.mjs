import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canActOnRefund,
  canRequestRefund,
  canRequestRushUpgrade,
  canRespondToRushUpgrade,
} from './contract-negotiation.ts';

test('rush upgrades require an active non-rush contract, the correct role, and verified KYC', () => {
  assert.equal(canRequestRushUpgrade({ role: 'employer', contractStatus: 'active', rushFee: 0, kycStatus: 'approved', hasOpenRequest: false }), true);
  assert.equal(canRequestRushUpgrade({ role: 'freelancer', contractStatus: 'active', rushFee: 0, kycStatus: 'approved', hasOpenRequest: false }), false);
  assert.equal(canRequestRushUpgrade({ role: 'employer', contractStatus: 'active', rushFee: 10, kycStatus: 'approved', hasOpenRequest: false }), false);
  assert.equal(canRequestRushUpgrade({ role: 'employer', contractStatus: 'active', rushFee: 0, kycStatus: 'pending', hasOpenRequest: false }), false);
  assert.equal(canRequestRushUpgrade({ role: 'employer', contractStatus: 'active', rushFee: 0, kycStatus: 'approved', hasOpenRequest: true }), false);
});

test('rush responses are limited to the verified party and current negotiation state', () => {
  assert.equal(canRespondToRushUpgrade('freelancer', 'pending', 'completed'), false);
  assert.equal(canRespondToRushUpgrade('employer', 'counter_offered', 'approved'), true);
  assert.equal(canRespondToRushUpgrade('employer', 'pending', 'approved'), false);
  assert.equal(canRespondToRushUpgrade('freelancer', 'accepted', 'approved'), false);
});

test('refund actions stay on active contracts and only the other party can decide', () => {
  assert.equal(canRequestRefund('active', 'approved', false), true);
  assert.equal(canRequestRefund('completed', 'approved', false), false);
  assert.equal(canRequestRefund('active', 'pending', false), false);
  assert.equal(canRequestRefund('active', 'approved', true), false);
  assert.equal(canActOnRefund({ status: 'pending', requestedBy: 'employer-1', currentUserId: 'freelancer-1', kycStatus: 'approved' }), true);
  assert.equal(canActOnRefund({ status: 'pending', requestedBy: 'employer-1', currentUserId: 'employer-1', kycStatus: 'approved' }), false);
  assert.equal(canActOnRefund({ status: 'approved', requestedBy: 'employer-1', currentUserId: 'freelancer-1', kycStatus: 'approved' }), false);
});
