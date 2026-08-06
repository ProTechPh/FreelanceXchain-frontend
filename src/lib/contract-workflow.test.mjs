import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getContractPermissions,
  getMilestonePermissions,
  normalizeMilestone,
} from './contract-workflow.ts';

test('normalizes milestone repository fields returned by the contract endpoint', () => {
  assert.deepEqual(normalizeMilestone({
    id: 'milestone-1',
    contract_id: 'contract-1',
    title: 'Design handoff',
    description: 'Deliver source files',
    amount: '500',
    due_date: '2026-09-01T00:00:00.000Z',
    status: 'submitted',
    deliverable_files: [{ filename: 'design.fig', url: 'https://files.test/design.fig', size: 10, mimeType: 'application/octet-stream' }],
  }), {
    id: 'milestone-1',
    contractId: 'contract-1',
    title: 'Design handoff',
    description: 'Deliver source files',
    amount: 500,
    dueDate: '2026-09-01T00:00:00.000Z',
    status: 'submitted',
    deliverableFiles: [{ filename: 'design.fig', url: 'https://files.test/design.fig', size: 10, mimeType: 'application/octet-stream' }],
  });
});

test('only verified employers can fund pending contracts', () => {
  assert.equal(getContractPermissions('pending', 'employer', 'approved').canFund, true);
  assert.equal(getContractPermissions('pending', 'employer', 'pending').canFund, false);
  assert.equal(getContractPermissions('pending', 'freelancer', 'approved').canFund, false);
});

test('milestone actions follow role and status transitions', () => {
  assert.deepEqual(getMilestonePermissions('in_progress', 'freelancer', 'approved', 'active'), {
    canSubmit: true,
    canApprove: false,
    canReject: false,
  });
  assert.deepEqual(getMilestonePermissions('submitted', 'employer', 'completed', 'active'), {
    canSubmit: false,
    canApprove: false,
    canReject: false,
  });
});
