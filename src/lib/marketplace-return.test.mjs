import assert from 'node:assert/strict';
import test from 'node:test';

import { getMarketplaceReturnPath } from './marketplace-return.ts';

test('preserves filters only for the expected marketplace route', () => {
  assert.equal(getMarketplaceReturnPath('/projects?keyword=react&minBudget=500', '/projects'), '/projects?keyword=react&minBudget=500');
  assert.equal(getMarketplaceReturnPath('/freelancers?keyword=solidity', '/freelancers'), '/freelancers?keyword=solidity');
});

test('rejects external and cross-marketplace return paths', () => {
  assert.equal(getMarketplaceReturnPath('//evil.example/projects', '/projects'), '/projects');
  assert.equal(getMarketplaceReturnPath('/freelancers?keyword=react', '/projects'), '/projects');
  assert.equal(getMarketplaceReturnPath(null, '/projects'), '/projects');
});
