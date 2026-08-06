import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeFreelancerProfile,
  normalizeFreelancerSkills,
} from './freelancer-profile-contract.ts';

test('normalizes current and persisted freelancer skill field shapes', () => {
  assert.deepEqual(normalizeFreelancerSkills([
    { name: ' React ', yearsOfExperience: 4 },
    { skillName: 'TypeScript', yearsOfExperience: 3 },
    { skill_name: 'Node.js', years_of_experience: 2 },
  ]), [
    { name: 'React', yearsOfExperience: 4 },
    { name: 'TypeScript', yearsOfExperience: 3 },
    { name: 'Node.js', yearsOfExperience: 2 },
  ]);
});

test('drops nameless skills instead of exposing unsafe profile data to components', () => {
  assert.deepEqual(normalizeFreelancerSkills([
    { yearsOfExperience: 5 },
    null,
    { name: '   ' },
    { name: 'Rust', yearsOfExperience: Number.NaN },
  ]), [
    { name: 'Rust', yearsOfExperience: 0 },
  ]);
  assert.deepEqual(normalizeFreelancerSkills(null), []);
});

test('normalizes skills while preserving the rest of a freelancer profile', () => {
  const profile = {
    id: 'profile-1',
    userId: 'user-1',
    bio: 'Frontend engineer',
    skills: [{ skill_name: 'Vue', years_of_experience: 6 }],
  };

  assert.deepEqual(normalizeFreelancerProfile(profile), {
    ...profile,
    skills: [{ name: 'Vue', yearsOfExperience: 6 }],
  });
});
