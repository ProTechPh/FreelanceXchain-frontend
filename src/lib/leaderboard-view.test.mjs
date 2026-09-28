import assert from 'node:assert/strict';
import test from 'node:test';

import { getLeaderboardProfileRoute, sortLeaderboard } from './leaderboard-view.ts';

const newcomer = {
  userId: 'new',
  userName: 'New',
  role: 'freelancer',
  averageRating: 5,
  totalRatings: 3,
  rankingScore: 4.38,
};

const proven = {
  userId: 'proven',
  userName: 'Proven',
  role: 'freelancer',
  averageRating: 4.9,
  totalRatings: 20,
  rankingScore: 4.72,
};

test('links each leaderboard role to the matching public profile', () => {
  assert.equal(getLeaderboardProfileRoute('freelancer', 'user-1'), '/freelancers/user-1');
  assert.equal(getLeaderboardProfileRoute('employer', 'user-2'), '/employers/user-2');
});

test('best-overall sorting keeps the confidence-weighted order', () => {
  assert.deepEqual(sortLeaderboard([newcomer, proven], 'overall').map((entry) => entry.userId), [
    'proven',
    'new',
  ]);
});

test('review sorting favors the larger body of feedback', () => {
  assert.deepEqual(sortLeaderboard([newcomer, proven], 'reviews').map((entry) => entry.userId), [
    'proven',
    'new',
  ]);
});
