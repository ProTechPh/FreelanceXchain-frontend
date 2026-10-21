import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMarketplaceSearchParams,
  createSavedSearchFilters,
  excludeOwnProjects,
  filterFreelancersByVisibleSkill,
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

test('enforces selected freelancer skill against visible profile skills', () => {
  const freelancers = [
    {
      userId: 'solidity-dev',
      skills: [{ name: 'Solidity', yearsOfExperience: 4 }],
    },
    {
      userId: 'ethereum-dev',
      skills: [
        { name: 'Node.js', yearsOfExperience: 5 },
        { name: 'Python', yearsOfExperience: 3 },
        { name: 'Ethereum', yearsOfExperience: 4 },
        { name: 'Smart Contracts', yearsOfExperience: 4 },
      ],
    },
  ];

  assert.deepEqual(
    filterFreelancersByVisibleSkill(freelancers, { keyword: '', skillIds: ['skill-solidity'] }, [
      { id: 'skill-solidity', name: 'Solidity' },
    ]).map((freelancer) => freelancer.userId),
    ['solidity-dev'],
  );
});

test("excludeOwnProjects hides only the viewer's listings", () => {
  const projects = [
    { id: 'p1', employerId: 'user-employer' },
    { id: 'p2', employerId: 'user-other' },
    { id: 'p3', employerId: 'user-employer' },
  ];

  assert.deepEqual(
    excludeOwnProjects(projects, 'user-employer').map((project) => project.id),
    ['p2'],
  );
  assert.deepEqual(
    excludeOwnProjects(projects, 'user-freelancer').map((project) => project.id),
    ['p1', 'p2', 'p3'],
  );
});

test('excludeOwnProjects leaves results untouched for signed-out visitors', () => {
  const projects = [{ id: 'p1', employerId: 'user-employer' }];

  assert.equal(excludeOwnProjects(projects, null), projects);
  assert.equal(excludeOwnProjects(projects, undefined), projects);
});

test('excludeOwnProjects does not mutate the incoming page', () => {
  const projects = [
    { id: 'p1', employerId: 'user-employer' },
    { id: 'p2', employerId: 'user-other' },
  ];

  excludeOwnProjects(projects, 'user-employer');

  assert.deepEqual(projects.map((project) => project.id), ['p1', 'p2']);
});
