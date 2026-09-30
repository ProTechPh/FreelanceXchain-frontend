import assert from 'node:assert/strict';
import test from 'node:test';

import { isTurnstileClientDisabled } from './turnstile-config.ts';

test('disables the client Turnstile widget only when explicitly configured', () => {
  assert.equal(isTurnstileClientDisabled({ NEXT_PUBLIC_DISABLE_TURNSTILE: 'true' }), true);
  assert.equal(isTurnstileClientDisabled({ NEXT_PUBLIC_DISABLE_TURNSTILE: 'false' }), false);
  assert.equal(isTurnstileClientDisabled({}), false);
});
