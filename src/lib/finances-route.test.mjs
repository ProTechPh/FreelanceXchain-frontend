import assert from 'node:assert/strict';
import test from 'node:test';

import { getFinancesRoute } from './finances-route.ts';

test('builds the canonical finance hub route for each participant role', () => {
  assert.equal(getFinancesRoute('freelancer'), '/dashboard/freelancer/finances');
  assert.equal(getFinancesRoute('employer'), '/dashboard/employer/finances');
});

test('deep-links to a finance tab without creating a second route', () => {
  assert.equal(
    getFinancesRoute('freelancer', 'transactions'),
    '/dashboard/freelancer/finances?tab=transactions',
  );
  assert.equal(
    getFinancesRoute('employer', 'billing'),
    '/dashboard/employer/finances?tab=billing',
  );
});
