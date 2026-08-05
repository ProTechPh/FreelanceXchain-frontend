import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyKycStatusError } from './kyc-status-error.ts';

test('classifies a 404 response as a missing KYC record', () => {
  assert.equal(classifyKycStatusError({ response: { status: 404 } }), 'not-found');
});

test('classifies server and network failures as unavailable', () => {
  assert.equal(classifyKycStatusError({ response: { status: 500 } }), 'unavailable');
  assert.equal(classifyKycStatusError(new Error('Network Error')), 'unavailable');
});
