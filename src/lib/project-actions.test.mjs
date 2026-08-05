import assert from 'node:assert/strict';
import test from 'node:test';

import { getProjectPrimaryAction } from './project-actions.ts';

const openProject = {
  employerId: 'employer-1',
  status: 'open',
};

test('lets the employer who owns a project manage its proposals', () => {
  assert.equal(
    getProjectPrimaryAction(
      { id: 'employer-1', role: 'employer' },
      openProject,
    ),
    'manage-proposals',
  );
});

test('never lets an employer submit a proposal, including on another employer project', () => {
  assert.equal(
    getProjectPrimaryAction(
      { id: 'employer-2', role: 'employer' },
      openProject,
    ),
    'none',
  );
});

test('lets freelancers submit proposals only while the project is open', () => {
  const freelancer = { id: 'freelancer-1', role: 'freelancer' };

  assert.equal(getProjectPrimaryAction(freelancer, openProject), 'submit-proposal');
  assert.equal(
    getProjectPrimaryAction(freelancer, { ...openProject, status: 'in_progress' }),
    'none',
  );
});

test('does not expose proposal actions before a viewer is authenticated', () => {
  assert.equal(getProjectPrimaryAction(null, openProject), 'none');
});
