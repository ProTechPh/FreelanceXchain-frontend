import assert from 'node:assert/strict';
import test from 'node:test';

import {
  validateEmployerProfile,
  validateExperience,
  findDuplicateExperience,
  validateFreelancerProfile,
} from './profile-form.ts';

test('validates freelancer profile fields against backend constraints', () => {
  assert.equal(validateFreelancerProfile({ bio: 'too short', hourlyRate: 0, availability: 'available' }), 'Bio must be at least 10 characters.');
  assert.equal(validateFreelancerProfile({ bio: 'A sufficiently detailed bio', hourlyRate: 0, availability: 'available' }), 'Hourly rate must be at least 1.');
  assert.equal(validateFreelancerProfile({ bio: 'A sufficiently detailed bio', hourlyRate: 25, availability: 'available' }), null);
});

test('validates employer profile fields against backend constraints', () => {
  assert.equal(validateEmployerProfile({ companyName: 'X', description: 'A detailed company description', industry: 'Tech' }), 'Company name must be at least 2 characters.');
  assert.equal(validateEmployerProfile({ companyName: 'Acme', description: 'short', industry: 'Tech' }), 'Description must be at least 10 characters.');
  assert.equal(validateEmployerProfile({ companyName: 'Acme', description: 'A detailed company description', industry: 'Tech' }), null);
});

test('requires coherent experience dates and backend minimum lengths', () => {
  assert.equal(validateExperience({ title: 'Engineer', company: 'Acme', description: 'Built accessible products', startDate: '', endDate: null }), 'Start date is required.');
  assert.equal(validateExperience({ title: 'Engineer', company: 'Acme', description: 'Built accessible products', startDate: '2026-01-01', endDate: '2025-01-01' }), 'End date cannot be before start date.');
  assert.equal(validateExperience({ title: 'Engineer', company: 'Acme', description: 'Built accessible products', startDate: '2025-01-01', endDate: null }), null);
});

test('finds a work history entry with the same position, company and dates', () => {
  const entries = [
    { id: 'e1', title: 'Nuclear Engineer', company: 'Meralco', startDate: '2026-06-03T00:00:00.000Z', endDate: '2026-10-22' },
    { id: 'e2', title: 'Radiation Officer', company: 'Meralco', startDate: '2026-06-03', endDate: null },
  ];
  const form = { title: ' nuclear  engineer ', company: 'MERALCO', description: 'Different text', startDate: '2026-06-03', endDate: '2026-10-22', skills: [] };
  assert.equal(findDuplicateExperience(form, entries, null)?.id, 'e1');
  // Saving the entry being edited is not a duplicate of itself.
  assert.equal(findDuplicateExperience(form, entries, 'e1'), undefined);
  // Different dates make it a separate stint.
  assert.equal(findDuplicateExperience({ ...form, endDate: null }, entries, null), undefined);
});
