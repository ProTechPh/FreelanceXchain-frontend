import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BECOME_EMPLOYER_PATH,
  getOtherRole,
  getRoleLabel,
  getRoleSwitchTarget,
  isOnRoleSide,
  isParticipantRole,
} from './role-switch.ts';

test('only freelancers and employers can switch roles', () => {
  assert.equal(isParticipantRole('freelancer'), true);
  assert.equal(isParticipantRole('employer'), true);
  assert.equal(isParticipantRole('admin'), false);
  assert.equal(isParticipantRole(undefined), false);
});

test('switches to the other participant role', () => {
  assert.equal(getOtherRole('freelancer'), 'employer');
  assert.equal(getOtherRole('employer'), 'freelancer');
  assert.equal(getRoleLabel('employer'), 'Employer');
  assert.equal(getRoleLabel('freelancer'), 'Freelancer');
});

test('offers a switch only for pages that belong to the other role', () => {
  assert.equal(getRoleSwitchTarget('employer', ['freelancer']), 'freelancer');
  assert.equal(getRoleSwitchTarget('freelancer', ['employer']), 'employer');
  // Already allowed: no switch needed.
  assert.equal(getRoleSwitchTarget('freelancer', ['freelancer']), null);
  // Admin pages, admins and unrestricted pages never offer a switch.
  assert.equal(getRoleSwitchTarget('freelancer', ['admin']), null);
  assert.equal(getRoleSwitchTarget('admin', ['freelancer']), null);
  assert.equal(getRoleSwitchTarget('employer', undefined), null);
  assert.equal(getRoleSwitchTarget(null, ['employer']), null);
});

test('the employer setup page lives on the freelancer side', () => {
  assert.equal(BECOME_EMPLOYER_PATH.startsWith('/dashboard/freelancer/'), true);
});

test('keeps only the contracts on the active side of the account', () => {
  const asEmployer = { employerId: 'user-1', freelancerId: 'user-2' };
  const asFreelancer = { employerId: 'user-3', freelancerId: 'user-1' };
  assert.equal(isOnRoleSide(asEmployer, 'employer', 'user-1'), true);
  assert.equal(isOnRoleSide(asEmployer, 'freelancer', 'user-1'), false);
  assert.equal(isOnRoleSide(asFreelancer, 'freelancer', 'user-1'), true);
  assert.equal(isOnRoleSide(asFreelancer, 'employer', 'user-1'), false);
  // Unknown user: nothing to filter on.
  assert.equal(isOnRoleSide(asFreelancer, 'employer', undefined), true);
});
