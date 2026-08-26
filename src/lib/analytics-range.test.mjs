import assert from 'node:assert/strict';
import test from 'node:test';

import {
  RANGE_PRESETS,
  DEFAULT_RANGE_PRESET,
  resolveRange,
  getRangeLabel,
} from './analytics-range.ts';

const NOW = new Date('2026-08-26T12:00:00.000Z');

test('all time sends no date params so the API returns the lifetime view', () => {
  assert.deepEqual(resolveRange('all', NOW), {});
});

test('day presets resolve to an ISO window ending at now', () => {
  assert.deepEqual(resolveRange('7d', NOW), {
    startDate: '2026-08-19T12:00:00.000Z',
    endDate: '2026-08-26T12:00:00.000Z',
  });
  assert.deepEqual(resolveRange('30d', NOW), {
    startDate: '2026-07-27T12:00:00.000Z',
    endDate: '2026-08-26T12:00:00.000Z',
  });
});

test('resolution is pure in now, so repeated calls agree', () => {
  assert.deepEqual(resolveRange('90d', NOW), resolveRange('90d', NOW));
});

test('an unknown preset degrades to the unfiltered view', () => {
  assert.deepEqual(resolveRange('nonsense', NOW), {});
});

test('every preset is resolvable and labelled', () => {
  for (const preset of RANGE_PRESETS) {
    assert.equal(typeof getRangeLabel(preset.id), 'string');
    const range = resolveRange(preset.id, NOW);
    if (preset.days === null) {
      assert.deepEqual(range, {});
    } else {
      assert.ok(range.startDate && range.endDate);
      const spanDays = (Date.parse(range.endDate) - Date.parse(range.startDate)) / 86_400_000;
      assert.equal(spanDays, preset.days);
    }
  }
});

test('the default preset is a real preset', () => {
  assert.ok(RANGE_PRESETS.some((p) => p.id === DEFAULT_RANGE_PRESET));
});
