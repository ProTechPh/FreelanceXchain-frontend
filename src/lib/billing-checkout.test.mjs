import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CHECKOUT_POLL_DELAYS_MS,
  CHECKOUT_MAX_ATTEMPTS,
  nextPollDelay,
  resolveCheckoutState,
  isAllowedBillingRedirect,
  getBillingReturnPath,
} from './billing-checkout.ts';

test('the poll schedule is bounded and starts immediately', () => {
  assert.equal(CHECKOUT_POLL_DELAYS_MS[0], 0, 'the first check should not wait');
  assert.equal(CHECKOUT_MAX_ATTEMPTS, CHECKOUT_POLL_DELAYS_MS.length);
  const total = CHECKOUT_POLL_DELAYS_MS.reduce((a, b) => a + b, 0);
  assert.ok(total > 10_000, 'should wait long enough for a normal webhook');
  assert.ok(total <= 30_000, 'should give up before the user thinks it hung');
});

test('the schedule backs off rather than hammering', () => {
  for (let i = 1; i < CHECKOUT_POLL_DELAYS_MS.length; i += 1) {
    assert.ok(
      CHECKOUT_POLL_DELAYS_MS[i] >= CHECKOUT_POLL_DELAYS_MS[i - 1],
      `delay ${i} is shorter than the one before it`,
    );
  }
});

test('nextPollDelay runs out instead of looping forever', () => {
  assert.equal(nextPollDelay(0), 0);
  assert.equal(nextPollDelay(CHECKOUT_MAX_ATTEMPTS), null);
  assert.equal(nextPollDelay(-1), null);
});

test('entitlement arriving at any point confirms', () => {
  assert.equal(resolveCheckoutState({ isPro: true, attempt: 0 }), 'confirmed');
  assert.equal(resolveCheckoutState({ isPro: true, attempt: 99 }), 'confirmed');
});

test('waits while the webhook is still in flight, then times out', () => {
  assert.equal(resolveCheckoutState({ isPro: false, attempt: 0 }), 'waiting');
  assert.equal(resolveCheckoutState({ isPro: false, attempt: CHECKOUT_MAX_ATTEMPTS - 1 }), 'waiting');
  assert.equal(resolveCheckoutState({ isPro: false, attempt: CHECKOUT_MAX_ATTEMPTS }), 'timed-out');
});

test('accepts genuine Stripe checkout and portal URLs', () => {
  assert.equal(isAllowedBillingRedirect('https://checkout.stripe.com/c/pay/cs_test_123'), true);
  assert.equal(isAllowedBillingRedirect('https://billing.stripe.com/p/session/test_123'), true);
});

test('rejects every redirect that is not an HTTPS Stripe host', () => {
  // A compromised or buggy endpoint must not become an open redirect.
  assert.equal(isAllowedBillingRedirect('http://checkout.stripe.com/c/pay'), false, 'plain http');
  assert.equal(isAllowedBillingRedirect('https://checkout.stripe.com.evil.com/c/pay'), false, 'suffix attack');
  assert.equal(isAllowedBillingRedirect('https://evil.com/checkout.stripe.com'), false, 'path lookalike');
  assert.equal(isAllowedBillingRedirect('javascript:alert(1)'), false, 'script url');
  assert.equal(isAllowedBillingRedirect('//checkout.stripe.com/c/pay'), false, 'protocol-relative');
  assert.equal(isAllowedBillingRedirect(''), false);
  assert.equal(isAllowedBillingRedirect(null), false);
  assert.equal(isAllowedBillingRedirect(undefined), false);
});

test('returnTo keeps a same-origin path', () => {
  assert.equal(getBillingReturnPath('/dashboard/freelancer', '/fallback'), '/dashboard/freelancer');
  assert.equal(
    getBillingReturnPath('/dashboard/employer/projects?tab=open', '/fallback'),
    '/dashboard/employer/projects?tab=open',
  );
});

test('returnTo refuses to send the user off-site', () => {
  assert.equal(getBillingReturnPath('https://evil.com', '/fallback'), '/fallback');
  assert.equal(getBillingReturnPath('//evil.com', '/fallback'), '/fallback');
  assert.equal(getBillingReturnPath('/\\evil.com', '/fallback'), '/fallback');
  assert.equal(getBillingReturnPath('javascript:alert(1)', '/fallback'), '/fallback');
  assert.equal(getBillingReturnPath('dashboard', '/fallback'), '/fallback', 'not rooted');
  assert.equal(getBillingReturnPath(null, '/fallback'), '/fallback');
  assert.equal(getBillingReturnPath('', '/fallback'), '/fallback');
});
