import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clearAccessToken,
  getAccessToken,
  isCookieSupported,
  setAccessToken,
} from './auth-token.ts';

function createMockStorage() {
  const store = new Map();
  return {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
    clear() { store.clear(); },
  };
}

test.beforeEach(() => {
  clearAccessToken();
  Object.defineProperty(globalThis, 'localStorage', {
    value: createMockStorage(),
    configurable: true,
    writable: true,
  });
});

test('stores and retrieves access token from memory', () => {
  setAccessToken('test-access-token');
  assert.equal(getAccessToken(), 'test-access-token');

  clearAccessToken();
  assert.equal(getAccessToken(), null);
});

test('prioritizes in-memory token over localStorage fallback', () => {
  globalThis.localStorage.setItem('access_token', 'stored-token');
  assert.equal(getAccessToken(), 'stored-token');

  setAccessToken('memory-token');
  assert.equal(getAccessToken(), 'memory-token');

  clearAccessToken();
  assert.equal(getAccessToken(), null);
  assert.equal(globalThis.localStorage.getItem('access_token'), null);
});

test('purges refresh_token from client storage whenever access token is updated', () => {
  globalThis.localStorage.setItem('refresh_token', 'stale-refresh-token');
  setAccessToken('new-token');
  assert.equal(globalThis.localStorage.getItem('refresh_token'), null);
});

test('does not write access token to localStorage when cookies are supported', () => {
  Object.defineProperty(globalThis, 'navigator', {
    value: { cookieEnabled: true },
    configurable: true,
    writable: true,
  });

  setAccessToken('cookie-enabled-token');
  assert.equal(getAccessToken(), 'cookie-enabled-token');
  assert.equal(globalThis.localStorage.getItem('access_token'), null);
});

test('writes access token to localStorage fallback only when cookies are explicitly disabled', () => {
  Object.defineProperty(globalThis, 'navigator', {
    value: { cookieEnabled: false },
    configurable: true,
    writable: true,
  });

  setAccessToken('fallback-token');
  assert.equal(getAccessToken(), 'fallback-token');
  assert.equal(globalThis.localStorage.getItem('access_token'), 'fallback-token');

  clearAccessToken();
  assert.equal(globalThis.localStorage.getItem('access_token'), null);
});
