import assert from 'node:assert/strict';
import test from 'node:test';

import { formatVacancies, getVacancies } from './vacancies.ts';

test('counts open spots out of the project total', () => {
  assert.deepEqual(getVacancies({ freelancerLimit: 5, hiredCount: 1 }), { left: 4, total: 5 });
  assert.deepEqual(getVacancies({ freelancerLimit: 5 }), { left: 5, total: 5 });
  assert.deepEqual(getVacancies({ freelancerLimit: 0, hiredCount: 0 }), { left: 1, total: 1 });
  assert.deepEqual(getVacancies({ freelancerLimit: 2, hiredCount: 3 }), { left: 0, total: 2 });
});

test('words vacancies instead of hires', () => {
  assert.equal(formatVacancies({ freelancerLimit: 5, hiredCount: 1 }), '4 of 5 vacancies left');
  assert.equal(formatVacancies({ freelancerLimit: 5, hiredCount: 4 }), '1 of 5 vacancies left');
  assert.equal(formatVacancies({ freelancerLimit: 1, hiredCount: 0 }), '1 of 1 vacancy left');
  assert.equal(formatVacancies({ freelancerLimit: 5, hiredCount: 5 }), 'No vacancies left');
  assert.equal(formatVacancies({ freelancerLimit: null, hiredCount: null }), '1 of 1 vacancy left');
});
