import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getApiErrorMessage,
  getRegistrationFormError,
  isAuthSuccessResponse,
  isMfaRequiredResponse,
  normalizeAuthUser,
} from './auth-contract.ts';

test('recognizes the current MFA-required response', () => {
  assert.equal(isMfaRequiredResponse({
    mfaRequired: true,
    mfaSessionToken: 'mfa-session-token',
  }), true);
});

test('recognizes a complete auth success response', () => {
  assert.equal(isAuthSuccessResponse({
    user: {
      id: 'user-1',
      email: 'person@example.com',
      role: 'freelancer',
      walletAddress: '',
      createdAt: '2026-07-30T00:00:00.000Z',
    },
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  }), true);
});

test('rejects incomplete or malformed auth success responses', () => {
  assert.equal(isAuthSuccessResponse({
    user: {
      id: 'user-1',
      email: 'person@example.com',
      role: 'freelancer',
      walletAddress: '',
    },
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  }), false);

  assert.equal(isAuthSuccessResponse({
    user: {
      id: 'user-1',
      email: 'person@example.com',
      role: 'unknown-role',
      walletAddress: '',
      createdAt: '2026-07-30T00:00:00.000Z',
    },
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  }), false);
});

test('normalizes auth users when the API omits domain-only display fields', () => {
  assert.deepEqual(normalizeAuthUser({
    id: 'user-1',
    email: 'person@example.com',
    role: 'freelancer',
    walletAddress: '',
    createdAt: '2026-07-30T00:00:00.000Z',
  }), {
    id: 'user-1',
    email: 'person@example.com',
    name: 'person',
    role: 'freelancer',
    walletAddress: '',
    createdAt: '2026-07-30T00:00:00.000Z',
    updatedAt: '2026-07-30T00:00:00.000Z',
  });
});

test('uses the structured API error message for rate limits and validation errors', () => {
  assert.equal(
    getApiErrorMessage({
      response: {
        data: {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many login attempts, please try again later',
          },
        },
      },
    }, 'Unable to sign in'),
    'Too many login attempts, please try again later',
  );
});

test('falls back when an error does not match the API error contract', () => {
  assert.equal(getApiErrorMessage(new Error('network failed'), 'Unable to sign in'), 'Unable to sign in');
});

test('matches the API password requirements before registration is submitted', () => {
  assert.equal(
    getRegistrationFormError('password', 'password', true),
    'Use 8–72 characters with uppercase, lowercase, a number, and a special character (@$!%*?&).',
  );
  assert.equal(getRegistrationFormError('StrongPass1!', 'StrongPass1!', true), null);
});

test('requires matching passwords and acceptance of the terms', () => {
  assert.equal(
    getRegistrationFormError('StrongPass1!', 'DifferentPass1!', true),
    'Passwords do not match.',
  );
  assert.equal(
    getRegistrationFormError('StrongPass1!', 'StrongPass1!', false),
    'You must agree to the Terms of Service and Privacy Policy.',
  );
});
