import assert from 'node:assert/strict';
import test from 'node:test';

import {
  submitProject,
  validateProjectStep,
} from './project-submission.ts';

const validForm = {
  title: 'Build a marketplace',
  description: 'Build a secure marketplace with employer project management.',
  skills: [
    { id: 'skill-react', name: 'React' },
    { id: 'skill-node', name: 'Node.js' },
  ],
  budget: '125',
  deadline: '2026-09-30',
  milestones: [
    { title: 'Design', description: 'Complete the approved UI design.', amount: '50' },
    { title: 'Build', description: 'Implement and deliver the application.', amount: '75' },
  ],
};

test('rejects incomplete project details before advancing', () => {
  assert.equal(
    validateProjectStep(1, {
      ...validForm,
      title: 'test',
    }),
    'Project title must be at least 5 characters.',
  );

  assert.equal(
    validateProjectStep(1, {
      ...validForm,
      description: 'Too short',
    }),
    'Project description must be at least 20 characters.',
  );
});

test('requires milestone amounts to match the total budget', () => {
  assert.equal(
    validateProjectStep(3, {
      ...validForm,
      budget: '130',
    }),
    'Milestone amounts must equal the total budget.',
  );
});

test('creates the project and then saves its milestones using the created project id', async () => {
  const calls = [];
  const api = {
    async create(payload) {
      calls.push(['create', payload]);
      return { data: { id: 'project-123', ...payload, milestones: [] } };
    },
    async setMilestones(projectId, payload) {
      calls.push(['setMilestones', projectId, payload]);
      return { data: { id: projectId, milestones: payload.milestones } };
    },
  };

  const created = await submitProject(api, validForm);

  assert.equal(created.id, 'project-123');
  assert.deepEqual(calls, [
    ['create', {
      title: 'Build a marketplace',
      description: 'Build a secure marketplace with employer project management.',
      requiredSkills: [
        { skillId: 'skill-react' },
        { skillId: 'skill-node' },
      ],
      budget: 125,
      deadline: '2026-09-30T23:59:59.999Z',
      isRush: false,
    }],
    ['setMilestones', 'project-123', {
      milestones: [
        {
          title: 'Design',
          description: 'Complete the approved UI design.',
          amount: 50,
          dueDate: '2026-09-30T23:59:59.999Z',
        },
        {
          title: 'Build',
          description: 'Implement and deliver the application.',
          amount: 75,
          dueDate: '2026-09-30T23:59:59.999Z',
        },
      ],
    }],
  ]);
});

test('does not save milestones when project creation fails', async () => {
  let milestoneSaveAttempted = false;
  const api = {
    async create() {
      throw new Error('create failed');
    },
    async setMilestones() {
      milestoneSaveAttempted = true;
    },
  };

  await assert.rejects(() => submitProject(api, validForm), /create failed/);
  assert.equal(milestoneSaveAttempted, false);
});
