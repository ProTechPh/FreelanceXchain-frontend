import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getLastUsedOAuthProvider,
  setLastUsedOAuthProvider,
  clearLastUsedOAuthProvider,
} from './last-used-auth.ts';

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
  Object.defineProperty(globalThis, 'localStorage', {
    value: createMockStorage(),
    configurable: true,
    writable: true,
  });
});

test('returns null when no provider has been stored', () => {
  assert.equal(getLastUsedOAuthProvider(), null);
});

test('stores and retrieves google provider', () => {
  setLastUsedOAuthProvider('google');
  assert.equal(getLastUsedOAuthProvider(), 'google');
  assert.equal(globalThis.localStorage.getItem('flxc_last_auth_provider'), 'google');
});

test('stores and retrieves github provider', () => {
  setLastUsedOAuthProvider('github');
  assert.equal(getLastUsedOAuthProvider(), 'github');
  assert.equal(globalThis.localStorage.getItem('flxc_last_auth_provider'), 'github');
});

test('clears stored provider when set to null or cleared', () => {
  setLastUsedOAuthProvider('google');
  assert.equal(getLastUsedOAuthProvider(), 'google');

  clearLastUsedOAuthProvider();
  assert.equal(getLastUsedOAuthProvider(), null);
  assert.equal(globalThis.localStorage.getItem('flxc_last_auth_provider'), null);

  setLastUsedOAuthProvider('github');
  assert.equal(getLastUsedOAuthProvider(), 'github');
  setLastUsedOAuthProvider(null);
  assert.equal(getLastUsedOAuthProvider(), null);
});

test('ignores and sanitizes invalid stored values', () => {
  globalThis.localStorage.setItem('flxc_last_auth_provider', 'unsupported_provider');
  assert.equal(getLastUsedOAuthProvider(), null);

  globalThis.localStorage.setItem('flxc_last_auth_provider', '<script>alert(1)</script>');
  assert.equal(getLastUsedOAuthProvider(), null);
});

test('gracefully handles missing or throwing localStorage', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem() { throw new Error('SecurityError: Access is denied'); },
      setItem() { throw new Error('SecurityError: Access is denied'); },
      removeItem() { throw new Error('SecurityError: Access is denied'); },
    },
    configurable: true,
    writable: true,
  });

  assert.doesNotThrow(() => {
    assert.equal(getLastUsedOAuthProvider(), null);
    setLastUsedOAuthProvider('google');
    clearLastUsedOAuthProvider();
  });
});
