import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createCsrfTokenManager,
  isCsrfValidationFailure,
  readCsrfCookie,
} from './csrf-token.ts';

test('reads the exact cookie name returned by the API', () => {
  const cookies = '__Host-psifi.x-csrf-token=production-token; psifi.x-csrf-token=development-token';

  assert.equal(
    readCsrfCookie(cookies, 'psifi.x-csrf-token'),
    'development-token',
  );
  assert.equal(
    readCsrfCookie(cookies, '__Host-psifi.x-csrf-token'),
    'production-token',
  );
});

test('gets a fresh token before trusting a cookie left by an older API process', async () => {
  let cookies = 'psifi.x-csrf-token=stale-token';
  let generationRequests = 0;
  const manager = createCsrfTokenManager({
    readCookies: () => cookies,
    requestToken: async () => {
      generationRequests += 1;
      cookies = 'psifi.x-csrf-token=fresh-token';
      return { cookieName: 'psifi.x-csrf-token' };
    },
  });

  assert.equal(await manager.ensureToken(), 'fresh-token');
  assert.equal(await manager.ensureToken(), 'fresh-token');
  assert.equal(generationRequests, 1);
});

test('force-refreshes a token after the API rejects it', async () => {
  let cookies = '';
  let nextToken = 0;
  const manager = createCsrfTokenManager({
    readCookies: () => cookies,
    requestToken: async () => {
      nextToken += 1;
      cookies = `psifi.x-csrf-token=token-${nextToken}`;
      return { cookieName: 'psifi.x-csrf-token' };
    },
  });

  assert.equal(await manager.ensureToken(), 'token-1');
  assert.equal(await manager.ensureToken({ forceRefresh: true }), 'token-2');
});

test('only classifies the API CSRF error as retryable', () => {
  assert.equal(isCsrfValidationFailure({
    response: {
      status: 403,
      data: { error: { code: 'CSRF_VALIDATION_FAILED' } },
    },
  }), true);
  assert.equal(isCsrfValidationFailure({
    response: {
      status: 403,
      data: { error: { code: 'FORBIDDEN' } },
    },
  }), false);
  assert.equal(isCsrfValidationFailure({ response: { status: 401 } }), false);
});
