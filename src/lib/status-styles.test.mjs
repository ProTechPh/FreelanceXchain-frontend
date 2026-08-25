import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatStatusLabel,
  getStatusTone,
  getStatusDescriptor,
  getStatusColor,
} from './status-styles.ts';

test('labels are sentence case with separators removed', () => {
  assert.equal(formatStatusLabel('in_progress'), 'In progress');
  assert.equal(formatStatusLabel('under_review'), 'Under review');
  assert.equal(formatStatusLabel('active'), 'Active');
  assert.equal(formatStatusLabel('counter_offered'), 'Counter-offered');
});

test('unknown statuses degrade to a neutral tone rather than throwing', () => {
  assert.equal(getStatusTone('something_new'), 'neutral');
  assert.equal(formatStatusLabel(''), 'Unknown');
});

test('shared statuses resolve identically across domains', () => {
  for (const domain of ['project', 'contract', 'milestone', 'proposal']) {
    assert.equal(getStatusTone('completed', domain), 'success');
    assert.equal(getStatusTone('cancelled', domain), 'destructive');
    assert.equal(getStatusTone('pending', domain), 'warning');
  }
});

test('an open dispute warns while an open project does not', () => {
  assert.equal(getStatusTone('open', 'project'), 'success');
  assert.equal(getStatusTone('open', 'dispute'), 'warning');
});

test('descriptors only ever emit semantic token classes', () => {
  const palette = /\b(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/;
  const statuses = [
    'completed', 'approved', 'accepted', 'resolved', 'active', 'available',
    'pending', 'submitted', 'under_review', 'busy', 'counter_offered',
    'in_progress', 'releasing', 'open', 'cancelled', 'rejected', 'declined',
    'disputed', 'withdrawn', 'expired', 'refunded', 'draft', 'unavailable',
    'totally_unknown',
  ];
  for (const status of statuses) {
    const { className, dotClassName } = getStatusDescriptor(status);
    assert.ok(!palette.test(className), `${status} leaked a palette class: ${className}`);
    assert.ok(!palette.test(dotClassName), `${status} leaked a palette dot class: ${dotClassName}`);
    assert.match(className, /bg-\w+-subtle text-\w+ border-\w+-border/);
  }
});

test('getStatusColor stays backwards compatible with the badge call sites', () => {
  assert.equal(getStatusColor('active'), getStatusDescriptor('active').className);
});
