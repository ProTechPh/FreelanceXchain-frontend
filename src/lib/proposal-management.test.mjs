import assert from 'node:assert/strict';
import test from 'node:test';

import { updateProposalDecision } from './proposal-management.ts';

test('accepts a proposal and returns the proposal from the contract response', async () => {
  const calls = [];
  const api = {
    async accept(id) {
      calls.push(['accept', id]);
      return { data: { proposal: { id, status: 'accepted' }, contract: { id: 'contract-1' } } };
    },
    async reject() {
      throw new Error('reject should not be called');
    },
  };

  const proposal = await updateProposalDecision(api, 'proposal-1', 'accept');

  assert.deepEqual(calls, [['accept', 'proposal-1']]);
  assert.equal(proposal.status, 'accepted');
});

test('rejects a proposal and returns the updated proposal', async () => {
  const calls = [];
  const api = {
    async accept() {
      throw new Error('accept should not be called');
    },
    async reject(id) {
      calls.push(['reject', id]);
      return { data: { id, status: 'rejected' } };
    },
  };

  const proposal = await updateProposalDecision(api, 'proposal-2', 'reject');

  assert.deepEqual(calls, [['reject', 'proposal-2']]);
  assert.equal(proposal.status, 'rejected');
});
