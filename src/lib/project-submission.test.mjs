import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getFreelancerLimitError,
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
  files: [],
};

function makeFile(name, size = 1024, type = 'application/pdf') {
  return new File([new Uint8Array(size)], name, { type });
}

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

test('validates optional project attachment limits before submission', () => {
  assert.equal(
    validateProjectStep(1, {
      ...validForm,
      files: Array.from({ length: 11 }, (_, index) => makeFile(`reference-${index}.pdf`)),
    }),
    'You can attach up to 10 project files.',
  );
  assert.equal(
    validateProjectStep(1, {
      ...validForm,
      files: [makeFile('large.pdf', 10 * 1024 * 1024 + 1)],
    }),
    'Each project attachment must be 10 MB or smaller.',
  );
  assert.equal(
    validateProjectStep(1, {
      ...validForm,
      files: [
        makeFile('one.pdf', 9 * 1024 * 1024),
        makeFile('two.pdf', 9 * 1024 * 1024),
        makeFile('three.pdf', 8 * 1024 * 1024),
      ],
    }),
    'Project attachments must total 25 MB or less.',
  );
  assert.match(
    validateProjectStep(1, {
      ...validForm,
      files: [makeFile('script.sh', 1024, 'text/x-shellscript')],
    }) || '',
    /File type not allowed/,
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
      freelancerLimit: 1,
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

test('creates a project with multipart data when reference files are selected', async () => {
  const calls = [];
  const files = [makeFile('brief.pdf'), makeFile('wireframe.png', 2048, 'image/png')];
  const api = {
    async create() {
      throw new Error('JSON creation should not be used for files');
    },
    async createWithAttachments(formData) {
      calls.push(['createWithAttachments', formData]);
      return { data: { id: 'project-with-files' } };
    },
    async setMilestones(projectId, payload) {
      calls.push(['setMilestones', projectId, payload]);
      return { data: { id: projectId, milestones: payload.milestones } };
    },
  };

  const created = await submitProject(api, { ...validForm, files });

  assert.equal(created.id, 'project-with-files');
  const submitted = calls[0][1];
  assert.equal(submitted.get('title'), validForm.title);
  assert.equal(submitted.get('description'), validForm.description);
  assert.equal(submitted.get('budget'), validForm.budget);
  assert.equal(submitted.get('deadline'), '2026-09-30T23:59:59.999Z');
  assert.deepEqual(JSON.parse(submitted.get('requiredSkills')), [
    { skillId: 'skill-react' },
    { skillId: 'skill-node' },
  ]);
  assert.deepEqual(submitted.getAll('files'), files);
  assert.equal(calls[1][0], 'setMilestones');
});

test('validates milestone duration must be a positive integer if provided', () => {
  assert.equal(
    validateProjectStep(2, {
      ...validForm,
      milestones: [
        { title: 'Design', description: 'Complete UI', amount: '50', durationDays: '0' },
      ],
    }),
    'Milestone 1 duration must be a positive number of days.',
  );
  assert.equal(
    validateProjectStep(2, {
      ...validForm,
      milestones: [
        { title: 'Design', description: 'Complete UI', amount: '50', durationDays: '2.5' },
      ],
    }),
    'Milestone 1 duration must be a positive number of days.',
  );
  assert.equal(
    validateProjectStep(2, {
      ...validForm,
      milestones: [
        { title: 'Design', description: 'Complete UI', amount: '50', durationDays: '7' },
      ],
    }),
    null,
  );
});

test('calculates progressive milestone due dates based on durationDays', async () => {
  let savedMilestones = null;
  const api = {
    async create(payload) {
      return { data: { id: 'project-with-durations', ...payload } };
    },
    async setMilestones(projectId, payload) {
      savedMilestones = payload.milestones;
      return { data: { id: projectId, milestones: payload.milestones } };
    },
  };

  const baseDate = new Date('2026-09-01T00:00:00.000Z');
  await submitProject(api, {
    ...validForm,
    deadline: '2026-09-30',
    milestones: [
      { title: 'Design', description: 'UI', amount: '50', durationDays: '7' },
      { title: 'Build', description: 'Code', amount: '75', durationDays: '10' },
    ],
  }, { now: baseDate });

  assert.deepEqual(savedMilestones, [
    {
      title: 'Design',
      description: 'UI',
      amount: 50,
      dueDate: '2026-09-08T23:59:59.999Z',
    },
    {
      title: 'Build',
      description: 'Code',
      amount: 75,
      dueDate: '2026-09-18T23:59:59.999Z',
    },
  ]);
});


test('freelancers needed must be a whole number from 1 to 50, not below those already hired', () => {
  assert.equal(getFreelancerLimitError(''), 'Enter how many freelancers you need.');
  assert.equal(getFreelancerLimitError('0'), 'Enter a whole number of at least 1.');
  assert.equal(getFreelancerLimitError('-2'), 'Enter a whole number of at least 1.');
  assert.equal(getFreelancerLimitError('2.5'), 'Enter a whole number of at least 1.');
  assert.equal(getFreelancerLimitError('51'), 'You can take on at most 50 freelancers.');
  assert.equal(getFreelancerLimitError('2', 3), "You've already hired 3, so this can't be lower than 3.");
  assert.equal(getFreelancerLimitError('3', 3), null);
  assert.equal(getFreelancerLimitError('1'), null);
  assert.equal(getFreelancerLimitError('50'), null);
});
