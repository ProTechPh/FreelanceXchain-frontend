import assert from 'node:assert/strict';
import test from 'node:test';

import { getNotificationDestination } from './notification-route.ts';

const base = { id: 'n-1', title: 'Update', message: 'Updated', isRead: false, createdAt: '', updatedAt: '' };

test('maps proposal and contract notifications to role-correct destinations', () => {
  assert.equal(getNotificationDestination({ ...base, type: 'proposal_received', data: { projectId: 'project-1' } }, 'employer'), '/dashboard/employer/projects/project-1/proposals');
  assert.equal(getNotificationDestination({ ...base, type: 'proposal_accepted', data: { contractId: 'contract-1' } }, 'freelancer'), '/dashboard/freelancer/contracts/contract-1');
  assert.equal(getNotificationDestination({ ...base, type: 'refund_requested', data: { relatedId: 'contract-2' } }, 'employer'), '/dashboard/employer/contracts/contract-2');
});

test('maps messages, ratings, and disputes without inventing missing resource ids', () => {
  assert.equal(getNotificationDestination({ ...base, type: 'message' }, 'freelancer'), '/dashboard/freelancer/messages');
  assert.equal(getNotificationDestination({ ...base, type: 'rating_received' }, 'employer'), '/dashboard/employer/reputation');
  assert.equal(getNotificationDestination({ ...base, type: 'dispute_created', data: { disputeId: 'dispute-1' } }, 'admin'), '/dashboard/admin/disputes');
  assert.equal(getNotificationDestination({ ...base, type: 'milestone_submitted', data: { milestoneId: 'milestone-1' } }, 'employer'), null);
});
