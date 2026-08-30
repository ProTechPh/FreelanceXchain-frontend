import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ProposalFormValidationError,
  submitProposal,
  validateProposalForm,
} from './proposal-submission.ts';

function makeFile(name, size = 1024, type = 'application/pdf') {
  return new File([new Uint8Array(size)], name, { type });
}

const validForm = {
  proposedRate: '500',
  estimatedDuration: '14',
  files: [makeFile('proposal.pdf')],
};

test('requires a positive rate, duration, and at least one attachment', () => {
  assert.equal(
    validateProposalForm({ ...validForm, proposedRate: '0' }),
    'Proposed rate must be greater than 0 ETH.',
  );
  assert.equal(
    validateProposalForm({ ...validForm, estimatedDuration: '0' }),
    'Estimated duration must be at least 1 day.',
  );
  assert.equal(
    validateProposalForm({ ...validForm, files: [] }),
    'Attach at least one proposal file.',
  );
});

test('rejects more than five attachments and oversized uploads', () => {
  assert.equal(
    validateProposalForm({
      ...validForm,
      files: Array.from({ length: 6 }, (_, index) => makeFile(`proposal-${index}.pdf`)),
    }),
    'You can attach up to 5 files.',
  );
  assert.equal(
    validateProposalForm({
      ...validForm,
      files: [makeFile('large.pdf', 10 * 1024 * 1024 + 1)],
    }),
    'Each attachment must be 10 MB or smaller.',
  );
});

test('submits proposal fields and files as multipart form data', async () => {
  let submittedFormData;
  const api = {
    async submitWithFiles(formData) {
      submittedFormData = formData;
      return { data: { id: 'proposal-123' } };
    },
  };

  const proposal = await submitProposal(api, 'project-123', validForm);

  assert.equal(proposal.id, 'proposal-123');
  assert.equal(submittedFormData.get('projectId'), 'project-123');
  assert.equal(submittedFormData.get('proposedRate'), '500');
  assert.equal(submittedFormData.get('estimatedDuration'), '14');
  assert.deepEqual(submittedFormData.getAll('files'), validForm.files);
});

test('does not call the API when proposal input is invalid', async () => {
  let apiCalled = false;
  const api = {
    async submitWithFiles() {
      apiCalled = true;
      return { data: { id: 'proposal-123' } };
    },
  };

  await assert.rejects(
    () => submitProposal(api, 'project-123', { ...validForm, files: [] }),
    ProposalFormValidationError,
  );
  assert.equal(apiCalled, false);
});
