import assert from 'node:assert/strict';
import test from 'node:test';

import {
  changeDatePart,
  dayOptions,
  joinDateParts,
  monthOptions,
  nextDateValue,
  splitDateValue,
  yearOptions,
} from './date-select.ts';

const MIN = '1980-01-01';
const TODAY = '2026-10-22';

test('lists only years between the earliest date and today, newest first', () => {
  const years = yearOptions(MIN, TODAY);
  assert.equal(years[0], '2026');
  assert.equal(years.at(-1), '1980');
  assert.equal(years.length, 47);
  assert.ok(!years.includes('2027'));
  assert.ok(!years.includes('1979'));
});

test('hides future months in the current year', () => {
  assert.deepEqual(monthOptions('2026', MIN, TODAY), ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
  assert.equal(monthOptions('2025', MIN, TODAY).length, 12);
  assert.deepEqual(monthOptions('', MIN, TODAY), []);
});

test('hides future days in the current month and respects month length', () => {
  assert.equal(dayOptions('2026', '10', MIN, TODAY).at(-1), '22');
  assert.equal(dayOptions('2024', '02', MIN, TODAY).length, 29);
  assert.equal(dayOptions('2025', '02', MIN, TODAY).length, 28);
  assert.deepEqual(dayOptions('2026', '', MIN, TODAY), []);
});

test('end date options start at the start date', () => {
  assert.deepEqual(yearOptions('2024-05-10', TODAY), ['2026', '2025', '2024']);
  assert.equal(monthOptions('2024', '2024-05-10', TODAY)[0], '05');
  assert.equal(dayOptions('2024', '05', '2024-05-10', TODAY)[0], '10');
});

test('changing the year drops a month or day that would now be in the future', () => {
  const parts = splitDateValue('2025-12-31');
  assert.equal(joinDateParts(changeDatePart(parts, 'year', '2026', MIN, TODAY)), '2026');
  assert.equal(joinDateParts(changeDatePart(splitDateValue('2025-10-30'), 'year', '2026', MIN, TODAY)), '2026-10');
  assert.equal(joinDateParts(changeDatePart(splitDateValue('2024-02-29'), 'year', '2025', MIN, TODAY)), '2025-02');
  assert.equal(joinDateParts(changeDatePart(splitDateValue('2024-03-15'), 'year', '2020', MIN, TODAY)), '2020-03-15');
});

test('round-trips complete and partial values', () => {
  for (const value of ['', '2024', '2024-05', '2024-05-10']) {
    assert.equal(joinDateParts(splitDateValue(value)), value);
  }
});

test('finds the next calendar day across month and year ends', () => {
  assert.equal(nextDateValue('2024-05-10'), '2024-05-11');
  assert.equal(nextDateValue('2024-02-28'), '2024-02-29');
  assert.equal(nextDateValue('2025-02-28'), '2025-03-01');
  assert.equal(nextDateValue('2025-12-31'), '2026-01-01');
});

test('an end date range starting the day after today lists nothing', () => {
  assert.deepEqual(yearOptions(nextDateValue('2026-12-31'), '2026-12-31'), []);
});
