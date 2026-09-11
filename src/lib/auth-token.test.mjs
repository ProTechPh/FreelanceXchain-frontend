import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  resetInMemoryToken,
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

test('stores and retrieves access token from memory and storage', () => {
  setAccessToken('test-access-token');
  assert.equal(getAccessToken(), 'test-access-token');
  assert.equal(globalThis.localStorage.getItem('access_token'), 'test-access-token');

  clearAccessToken();
  assert.equal(getAccessToken(), null);
  assert.equal(globalThis.localStorage.getItem('access_token'), null);
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

test('persists access token to storage across simulated browser closes', () => {
  setAccessToken('persistent-token');
  assert.equal(getAccessToken(), 'persistent-token');

  // Simulate closing and reopening the browser: memory is reset, but localStorage persists
  resetInMemoryToken();
  assert.equal(globalThis.localStorage.getItem('access_token'), 'persistent-token');
  assert.equal(getAccessToken(), 'persistent-token');

  clearAccessToken();
  assert.equal(getAccessToken(), null);
  assert.equal(globalThis.localStorage.getItem('access_token'), null);
});
