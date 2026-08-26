import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAuditSearchParams,
  clampAuditLimit,
  appendCursorPage,
  isAuditLogStatus,
  hasActiveAuditFilters,
} from './audit-log-search.ts';

test('drops empty and whitespace-only filters instead of sending blank params', () => {
  assert.deepEqual(
    buildAuditSearchParams({ action: '', actor: '   ', resourceType: 'contract' }),
    { resourceType: 'contract' },
  );
});

test('trims surrounding whitespace on kept filters', () => {
  assert.deepEqual(buildAuditSearchParams({ action: '  login  ' }), { action: 'login' });
});

test('drops a status outside the enum the API accepts', () => {
  assert.deepEqual(buildAuditSearchParams({ status: 'banana' }), {});
  assert.deepEqual(buildAuditSearchParams({ status: 'failure' }), { status: 'failure' });
});

test('recognizes exactly the three backend statuses', () => {
  assert.ok(isAuditLogStatus('success'));
  assert.ok(isAuditLogStatus('failure'));
  assert.ok(isAuditLogStatus('pending'));
  assert.equal(isAuditLogStatus('SUCCESS'), false);
  assert.equal(isAuditLogStatus(undefined), false);
});

test('clamps limit into the range the route will honour', () => {
  assert.equal(clampAuditLimit(0), 1);
  assert.equal(clampAuditLimit(-5), 1);
  assert.equal(clampAuditLimit(1000), 200);
  assert.equal(clampAuditLimit(50.7), 50);
});

test('ignores a non-finite limit rather than sending NaN', () => {
  assert.deepEqual(buildAuditSearchParams({ limit: Number.NaN }), {});
});

test('passes the cursor through for the next page', () => {
  assert.deepEqual(buildAuditSearchParams({ cursor: 'doc-42' }), { cursor: 'doc-42' });
});

test('appends a page and de-duplicates rows already shown', () => {
  const previous = [{ id: 'a' }, { id: 'b' }];
  const merged = appendCursorPage(previous, {
    items: [{ id: 'b' }, { id: 'c' }],
    total: 3,
    hasMore: false,
    nextCursor: null,
  });
  assert.deepEqual(merged.map((e) => e.id), ['a', 'b', 'c']);
});

test('appending does not mutate the previous page', () => {
  const previous = [{ id: 'a' }];
  appendCursorPage(previous, { items: [{ id: 'b' }], total: 2, hasMore: false, nextCursor: null });
  assert.deepEqual(previous.map((e) => e.id), ['a']);
});

test('pagination state alone does not count as an active filter', () => {
  assert.equal(hasActiveAuditFilters({ cursor: 'doc-1', limit: 50 }), false);
  assert.equal(hasActiveAuditFilters({ status: 'failure' }), true);
});
