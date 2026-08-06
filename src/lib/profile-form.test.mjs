import assert from 'node:assert/strict';
import test from 'node:test';

import {
  validateEmployerProfile,
  validateExperience,
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
