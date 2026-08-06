import assert from 'node:assert/strict';
import test from 'node:test';

import { getContractDetailRoute } from './contract-route.ts';

test('builds role-scoped contract detail routes', () => {
  assert.equal(
    getContractDetailRoute('employer', 'contract-1'),
    '/dashboard/employer/contracts/contract-1',
  );
  assert.equal(
    getContractDetailRoute('freelancer', 'contract-2'),
    '/dashboard/freelancer/contracts/contract-2',
  );
});
