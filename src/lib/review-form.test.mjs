import assert from 'node:assert/strict';
import test from 'node:test';

import { validateReviewDraft } from './review-form.ts';

const valid = {
  rating: 5,
  comment: 'Excellent work and clear communication.',
  workQuality: 5,
  communication: 5,
  professionalism: 5,
  wouldWorkAgain: true,
};

test('validates the completed-contract review payload', () => {
  assert.equal(validateReviewDraft({ ...valid, rating: 0 }), 'Overall rating must be between 1 and 5.');
  assert.equal(validateReviewDraft({ ...valid, comment: '  ' }), 'Add a comment about the completed contract.');
  assert.equal(validateReviewDraft({ ...valid, communication: 6 }), 'Category ratings must be between 1 and 5.');
  assert.equal(validateReviewDraft(valid), null);
});
