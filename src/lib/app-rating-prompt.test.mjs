import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DISMISSAL_COOLDOWN_DAYS,
  MAX_COMMENT_LENGTH,
  MAX_DISMISSALS,
  parseDismissals,
  recordDismissal,
  shouldPromptFor,
  validateAppRatingDraft,
} from './app-rating-prompt.ts';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-09-21T12:00:00.000Z');
const daysAgo = (n) => new Date(NOW - n * DAY_MS).toISOString();

test('a star on its own is a complete submission', () => {
  assert.equal(validateAppRatingDraft({ rating: 4, comment: '' }), null);
  assert.equal(validateAppRatingDraft({ rating: 1, comment: '   ' }), null);
});

test('the rating itself is required and must be a whole 1-5', () => {
  const message = 'Pick a rating from 1 to 5 stars.';
  assert.equal(validateAppRatingDraft({ rating: 0, comment: '' }), message);
  assert.equal(validateAppRatingDraft({ rating: 6, comment: '' }), message);
  assert.equal(validateAppRatingDraft({ rating: 2.5, comment: '' }), message);
  assert.equal(validateAppRatingDraft({ rating: Number.NaN, comment: '' }), message);
});

test('an over-long comment is rejected', () => {
  const draft = { rating: 5, comment: 'x'.repeat(MAX_COMMENT_LENGTH + 1) };
  assert.equal(validateAppRatingDraft(draft), `Keep your comment under ${MAX_COMMENT_LENGTH} characters.`);
  assert.equal(validateAppRatingDraft({ rating: 5, comment: 'x'.repeat(MAX_COMMENT_LENGTH) }), null);
});

test('a fresh browser is prompted', () => {
  assert.equal(shouldPromptFor('contract_completed', 'contract-1', [], NOW), true);
});

test('opening the form from the account menu is never suppressed', () => {
  const dismissals = Array.from({ length: MAX_DISMISSALS + 2 }, () => ({
    source: 'manual',
    at: daysAgo(0),
  }));
  assert.equal(shouldPromptFor('manual', undefined, dismissals, NOW), true);
});

test('a dismissed event is never raised again, however long ago it was', () => {
  const dismissals = [{ source: 'contract_completed', contextId: 'contract-1', at: daysAgo(400) }];
  assert.equal(shouldPromptFor('contract_completed', 'contract-1', dismissals, NOW), false);
  // A different contract is a different event.
  assert.equal(shouldPromptFor('contract_completed', 'contract-2', dismissals, NOW), true);
});

test('a dismissal quiets the whole source for the cooldown, then lifts', () => {
  const justNow = [{ source: 'proposal_submitted', contextId: 'p-1', at: daysAgo(1) }];
  assert.equal(shouldPromptFor('proposal_submitted', 'p-2', justNow, NOW), false);

  const lapsed = [{ source: 'proposal_submitted', contextId: 'p-1', at: daysAgo(DISMISSAL_COOLDOWN_DAYS + 1) }];
  assert.equal(shouldPromptFor('proposal_submitted', 'p-2', lapsed, NOW), true);
});

test('a dismissal does not quiet a different source', () => {
  const dismissals = [{ source: 'contract_completed', contextId: 'c-1', at: daysAgo(1) }];
  assert.equal(shouldPromptFor('ai_recommendations', undefined, dismissals, NOW), true);
});

test('after enough dismissals we stop asking automatically', () => {
  const dismissals = Array.from({ length: MAX_DISMISSALS }, (_, i) => ({
    source: 'contract_completed',
    contextId: `c-${i}`,
    at: daysAgo(500),
  }));
  assert.equal(dismissals.length, MAX_DISMISSALS);
  assert.equal(shouldPromptFor('milestone_released', 'm-1', dismissals, NOW), false);
});

test('recording a dismissal keeps event-specific entries and expires bare ones', () => {
  const existing = [
    { source: 'contract_completed', contextId: 'c-1', at: daysAgo(400) },
    { source: 'ai_recommendations', at: daysAgo(400) },
    { source: 'ai_proposal_draft', at: daysAgo(1) },
  ];

  const next = recordDismissal(existing, 'proposal_accepted', 'p-9', NOW);

  assert.deepEqual(
    next.map((d) => d.source),
    ['contract_completed', 'ai_proposal_draft', 'proposal_accepted'],
  );
  assert.equal(next.at(-1).contextId, 'p-9');
  assert.equal(next.at(-1).at, new Date(NOW).toISOString());
});

test('a dismissal without a context id is stored without the key', () => {
  const [entry] = recordDismissal([], 'ai_skill_extraction', undefined, NOW);
  assert.equal('contextId' in entry, false);
});

test('unreadable storage degrades to "never dismissed" rather than throwing', () => {
  assert.deepEqual(parseDismissals(null), []);
  assert.deepEqual(parseDismissals(''), []);
  assert.deepEqual(parseDismissals('not json'), []);
  assert.deepEqual(parseDismissals('{"not":"an array"}'), []);
});

test('corrupt entries are dropped, valid ones survive', () => {
  const raw = JSON.stringify([
    { source: 'contract_completed', contextId: 'c-1', at: '2026-09-01T00:00:00.000Z' },
    { source: 'not-a-real-source', at: '2026-09-01T00:00:00.000Z' },
    { source: 'manual', at: 'not a date' },
    null,
    'nope',
  ]);

  const parsed = parseDismissals(raw);

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].source, 'contract_completed');
});
