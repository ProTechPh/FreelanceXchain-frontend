import assert from 'node:assert/strict';
import test from 'node:test';

import { canUseDisputeActions, validateDisputeDraft } from './dispute-form.ts';

test('requires verified KYC for dispute actions', () => {
  assert.equal(canUseDisputeActions('approved'), true);
  assert.equal(canUseDisputeActions('completed'), true);
  assert.equal(canUseDisputeActions('pending'), false);
  assert.equal(canUseDisputeActions(undefined), false);
});

test('validates the dispute fields required by the backend', () => {
  assert.equal(validateDisputeDraft({ contractId: '', milestoneId: '', reason: '' }), 'Choose a contract.');
  assert.equal(validateDisputeDraft({ contractId: 'contract-1', milestoneId: '', reason: '' }), 'Choose a milestone.');
  assert.equal(validateDisputeDraft({ contractId: 'contract-1', milestoneId: 'milestone-1', reason: 'short' }), 'Describe the issue in at least 10 characters.');
  assert.equal(validateDisputeDraft({ contractId: 'contract-1', milestoneId: 'milestone-1', reason: 'The delivered files are incomplete.' }), null);
});
