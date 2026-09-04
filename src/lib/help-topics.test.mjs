import assert from 'node:assert/strict';
import test from 'node:test';

import { HELP_TOPICS } from './help-topics.ts';
import { getStepIndexById, getTourSteps } from './onboarding-tour.ts';

test('every help topic asks a question and answers it', () => {
  for (const [id, topic] of Object.entries(HELP_TOPICS)) {
    assert.ok(topic.question.endsWith('?'), `${id} is not phrased as a question`);
    assert.ok(topic.answer.length > 40, `${id} answers too briefly to be useful`);
  }
});

test('the tour step a topic hands off to actually exists for both roles', () => {
  // A typo here would silently drop the reader at step 1 instead of the step
  // that answers their question, which is the kind of bug nobody reports.
  for (const [id, topic] of Object.entries(HELP_TOPICS)) {
    if (!topic.step) continue;
    for (const role of ['freelancer', 'employer']) {
      const ids = getTourSteps(role).map((step) => step.id);
      assert.ok(ids.includes(topic.step), `${id} points at "${topic.step}", missing from the ${role} tour`);
      assert.ok(getStepIndexById(role, topic.step) > 0, `${id} resolves to the opening step for ${role}`);
    }
  }
});

test('an unknown step id falls back to the start rather than throwing', () => {
  assert.equal(getStepIndexById('freelancer', 'no-such-step'), 0);
  assert.equal(getStepIndexById('freelancer', undefined), 0);
  assert.equal(getStepIndexById('admin', 'wallet'), 0);
});
