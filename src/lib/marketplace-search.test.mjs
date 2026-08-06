import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMarketplaceSearchParams,
  createSavedSearchFilters,
  restoreSavedSearchFilters,
  marketplaceFiltersFromSearchParams,
  marketplaceFiltersToSearchParams,
} from './marketplace-search.ts';

const skills = [
  { id: 'skill-react', name: 'React' },
  { id: 'skill-node', name: 'Node.js' },
];

test('builds the backend search contract without blank filters', () => {
  assert.deepEqual(buildMarketplaceSearchParams({
    keyword: '  dashboard  ',
    skillIds: ['skill-react', 'skill-node'],
    minBudget: 500,
    maxBudget: 2500,
  }, 24), {
    keyword: 'dashboard',
    skills: 'skill-react,skill-node',
    minBudget: 500,
    maxBudget: 2500,
    pageSize: 12,
    continuationToken: '24',
  });

  assert.deepEqual(buildMarketplaceSearchParams({ keyword: '  ', skillIds: [] }), {
    pageSize: 12,
  });
});

test('round-trips shareable marketplace filters through the URL', () => {
  const filters = marketplaceFiltersFromSearchParams(new URLSearchParams('keyword=api&skills=skill-react%2Cskill-node&minBudget=500&maxBudget=2500'));
  assert.deepEqual(filters, { keyword: 'api', skillIds: ['skill-react', 'skill-node'], minBudget: 500, maxBudget: 2500 });
  assert.equal(marketplaceFiltersToSearchParams(filters).toString(), 'keyword=api&skills=skill-react%2Cskill-node&minBudget=500&maxBudget=2500');
});

test('saved searches retain skill names for backend notifications and ids for the UI', () => {
  assert.deepEqual(createSavedSearchFilters({
    keyword: 'react',
    skillIds: ['skill-react'],
    minBudget: 1000,
  }, skills), {
    keyword: 'react',
    skills: ['React'],
    skillIds: ['skill-react'],
    minBudget: 1000,
  });
});

test('restores both current and legacy name-only saved skill filters', () => {
  assert.deepEqual(restoreSavedSearchFilters({
    keyword: 'api',
    skills: ['Node.js'],
  }, skills), {
    keyword: 'api',
    skillIds: ['skill-node'],
  });
});
