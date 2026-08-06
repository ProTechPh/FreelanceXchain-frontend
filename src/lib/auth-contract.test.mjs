import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getApiErrorMessage,
  getAuthCallbackToken,
  getPasswordResetToken,
  getRegistrationFormError,
  isAuthSuccessResponse,
  isMfaRequiredResponse,
  isRegistrationRequiredResponse,
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

test('uses string errors returned by current refund, milestone, and upload routes', () => {
  assert.equal(
    getApiErrorMessage({ response: { data: { error: 'Refund reason is required' } } }, 'Unable to request refund'),
    'Refund reason is required',
  );
  assert.equal(
    getApiErrorMessage({ response: { data: { message: 'Attachment is too large' } } }, 'Unable to upload'),
    'Attachment is too large',
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

test('reads the Appwrite recovery secret as the backend reset access token', () => {
  assert.equal(
    getPasswordResetToken(new URLSearchParams('userId=user-1&secret=recovery-secret')),
    'recovery-secret',
  );
  assert.equal(getPasswordResetToken(new URLSearchParams('accessToken=direct-token')), 'direct-token');
  assert.equal(getPasswordResetToken(new URLSearchParams('secret=')), null);
});

test('reads OAuth tokens from Appwrite callback query or fragment parameters', () => {
  assert.equal(
    getAuthCallbackToken(
      new URLSearchParams('userId=user-1&secret=oauth-secret'),
      new URLSearchParams(),
    ),
    'oauth-secret',
  );
  assert.equal(
    getAuthCallbackToken(
      new URLSearchParams(),
      new URLSearchParams('access_token=fragment-token'),
    ),
    'fragment-token',
  );
});

test('recognizes OAuth users that still need to choose a role', () => {
  assert.equal(isRegistrationRequiredResponse({ status: 'registration_required' }), true);
  assert.equal(isRegistrationRequiredResponse({ status: 'authenticated' }), false);
});
