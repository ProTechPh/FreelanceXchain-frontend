import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PRO_FEATURE_COPY,
  PRO_ONLY_ENDPOINTS,
  FREE_ENDPOINTS,
  PLAN_COMPARISON,
  PLAN_FOOTNOTES,
} from './plan-features.ts';

test('every lockable feature has copy a user can act on', () => {
  for (const [feature, copy] of Object.entries(PRO_FEATURE_COPY)) {
    assert.ok(copy.title?.length > 0, `${feature} has no title`);
    assert.ok(copy.description?.length > 0, `${feature} has no description`);
    assert.ok(copy.endpoint?.startsWith('/'), `${feature} has no endpoint`);
  }
});

test('every feature we lock is actually gated by the API', () => {
  // Guards against showing a paywall over something the server serves freely.
  for (const [feature, copy] of Object.entries(PRO_FEATURE_COPY)) {
    assert.ok(
      PRO_ONLY_ENDPOINTS.some((endpoint) => copy.endpoint.startsWith(endpoint)),
      `${feature} points at ${copy.endpoint}, which is not in PRO_ONLY_ENDPOINTS`,
    );
  }
});

test('every Pro row on the pricing page maps to a gated endpoint', () => {
  // This is what stops the pricing table over-claiming. A row may omit an
  // endpoint only when it describes ranking rather than an API call.
  const RANKING_ONLY = 'Priority matching — your profile and projects rank higher';

  for (const row of PLAN_COMPARISON) {
    if (row.free || !row.pro) continue;
    if (row.feature === RANKING_ONLY) {
      assert.equal(row.endpoint, undefined);
      continue;
    }
    assert.ok(row.endpoint, `"${row.feature}" is sold as Pro but names no endpoint`);
    assert.ok(
      PRO_ONLY_ENDPOINTS.includes(row.endpoint),
      `"${row.feature}" claims ${row.endpoint} is Pro, but it is not gated`,
    );
  }
});

test('nothing free is ever sold as a Pro-only feature', () => {
  for (const row of PLAN_COMPARISON) {
    if (row.endpoint) {
      assert.ok(
        !FREE_ENDPOINTS.includes(row.endpoint),
        `"${row.feature}" points at ${row.endpoint}, which is free for everyone`,
      );
    }
  }
  // And no endpoint may be in both lists.
  for (const endpoint of FREE_ENDPOINTS) {
    assert.ok(!PRO_ONLY_ENDPOINTS.includes(endpoint), `${endpoint} is in both lists`);
  }
});

test('every Pro row is also a Free row, or Pro would be a downgrade', () => {
  for (const row of PLAN_COMPARISON) {
    if (row.free) {
      assert.equal(row.pro, true, `"${row.feature}" is free but not included in Pro`);
    }
  }
});

test('the honesty footnotes are present', () => {
  assert.ok(PLAN_FOOTNOTES.length >= 3);
  assert.ok(PLAN_FOOTNOTES.some((note) => note.toLowerCase().includes('ranking only')));
  assert.ok(PLAN_FOOTNOTES.some((note) => note.toLowerCase().includes('cancel any time')));
});
