import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeFreelancerExperience,
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
    experience: [],
  });
});

test('normalizes legacy experience fields and assigns stable unique ids', () => {
  assert.deepEqual(normalizeFreelancerExperience([
    {
      id: 'experience-1',
      title: 'Engineer',
      company: 'Current Co',
      description: 'Current contract',
      startDate: '2024-01-01',
      endDate: null,
    },
    {
      id: 'experience-1',
      title: 'Developer',
      company: 'Duplicate Co',
      description: 'Duplicate persisted id',
      start_date: '2022-01-01',
      end_date: '2023-12-31',
    },
    {
      experience_id: 'experience-3',
      title: 'Consultant',
      company: 'Legacy Co',
      description: 'Legacy identifier',
      start_date: '2020-01-01',
      end_date: null,
    },
    {
      title: 'Intern',
      company: 'Old Co',
      description: 'Missing persisted id',
      startDate: '2019-01-01',
      endDate: '2019-12-31',
    },
  ]), [
    {
      id: 'experience-1',
      title: 'Engineer',
      company: 'Current Co',
      description: 'Current contract',
      startDate: '2024-01-01',
      endDate: null,
    },
    {
      id: 'legacy-experience-1',
      title: 'Developer',
      company: 'Duplicate Co',
      description: 'Duplicate persisted id',
      startDate: '2022-01-01',
      endDate: '2023-12-31',
    },
    {
      id: 'experience-3',
      title: 'Consultant',
      company: 'Legacy Co',
      description: 'Legacy identifier',
      startDate: '2020-01-01',
      endDate: null,
    },
    {
      id: 'legacy-experience-3',
      title: 'Intern',
      company: 'Old Co',
      description: 'Missing persisted id',
      startDate: '2019-01-01',
      endDate: '2019-12-31',
    },
  ]);
});
