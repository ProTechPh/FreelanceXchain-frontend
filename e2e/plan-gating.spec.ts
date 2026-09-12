import { expect, test, type Page } from '@playwright/test';

const createdAt = '2026-01-01T00:00:00.000Z';

type Plan = 'free' | 'pro';

async function authenticate(
  page: Page,
  role: 'freelancer' | 'employer' | 'admin',
  plan?: Plan,
) {
  const user = {
    id: `${role}-1`,
    email: `${role}@example.com`,
    name: role,
    role,
    // Deliberately omitted for the admin case: entitlement must come from the
    // role, not from a plan field.
    ...(plan ? { plan } : {}),
    walletAddress: '',
    kycStatus: 'approved',
    createdAt,
    updatedAt: createdAt,
  };

  await page.addInitScript((storedUser) => {
    try {
      localStorage.setItem('access_token', 'app-access-token');
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { user: storedUser, isAuthenticated: true }, version: 0 }),
      );
    } catch {
      // Ignore initial frame security errors
    }
  }, user);

  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user }) }),
  );
  await page.route('**/auth/csrf-token', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' },
      body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }),
    }),
  );
  await page.route('**/api/notifications/unread-count', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }),
  );
  await page.route('**/api/notifications/stream', (route) => route.abort());

  return user;
}

/** Count requests to a path so we can assert a gated call never goes out. */
function countRequests(page: Page, fragment: string) {
  const counter = { total: 0 };
  page.on('request', (request) => {
    if (request.url().includes(fragment)) counter.total += 1;
  });
  return counter;
}

test('a free freelancer sees the lock and never calls the gated endpoint', async ({ page }) => {
  await authenticate(page, 'freelancer', 'free');
  const matching = countRequests(page, '/api/matching/projects');

  await page.goto('/dashboard/freelancer/recommendations');

  // The heading stays outside the gate, so the route still identifies itself.
  await expect(page.getByRole('heading', { name: /recommended projects/i })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Pro feature' })).toBeVisible();
  await expect(page.getByRole('button', { name: /upgrade to pro/i })).toBeVisible();

  // The gate is only half the job — the request must not be sent at all.
  expect(matching.total).toBe(0);
});

test('a pro freelancer sees the real feature with no lock', async ({ page }) => {
  await authenticate(page, 'freelancer', 'pro');
  await page.route('**/api/matching/projects**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
  );

  await page.goto('/dashboard/freelancer/recommendations');

  await expect(page.getByRole('heading', { name: /recommended projects/i })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Pro feature' })).toHaveCount(0);
});

test('an admin is never paywalled, even with no plan field at all', async ({ page }) => {
  // Regression guard for hasProAccess: staff operate the platform and are not
  // billed for it, so entitlement comes from the role.
  await authenticate(page, 'admin');
  const skillTrends = countRequests(page, '/api/analytics/skill-trends');

  await page.route('**/api/analytics/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
  );
  await page.route('**/api/audit-logs/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0 }) }),
  );

  await page.goto('/dashboard/admin/analytics');

  await expect(page.getByRole('region', { name: 'Pro feature' })).toHaveCount(0);
  await expect.poll(() => skillTrends.total).toBeGreaterThan(0);
});

test('upgrading sends the browser to Stripe checkout', async ({ page }) => {
  await authenticate(page, 'freelancer', 'free');

  await page.route('**/api/billing/checkout-session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: 'https://checkout.stripe.com/c/pay/cs_test_123', sessionId: 'cs_test_123' }),
    }),
  );
  await page.route('https://checkout.stripe.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Stripe Checkout</h1>' }),
  );

  await page.goto('/dashboard/freelancer/recommendations');
  await page.getByRole('button', { name: /upgrade to pro/i }).first().click();

  await expect(page.getByRole('heading', { name: 'Stripe Checkout' })).toBeVisible();
});

test('the success page waits for the webhook, then confirms', async ({ page }) => {
  // Entitlement is granted by webhook, which can land after this redirect.
  let calls = 0;
  await page.route('**/api/auth/me', (route) => {
    calls += 1;
    const plan = calls >= 3 ? 'pro' : 'free';
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'freelancer-1', email: 'f@example.com', name: 'f', role: 'freelancer',
          plan, walletAddress: '', kycStatus: 'approved', createdAt, updatedAt: createdAt,
        },
      }),
    });
  });
  await page.addInitScript(() => {
    try {
      localStorage.setItem('access_token', 'app-access-token');
    } catch {
      // Ignore initial frame security errors
    }
  });

  await page.goto('/billing/checkout/success?session_id=cs_test_123&returnTo=%2Fdashboard%2Ffreelancer');

  // Never claims the user is still on Free — the payment already succeeded.
  await expect(page.getByText(/payment received/i)).toBeVisible();
  await expect(page.getByText(/free plan/i)).toHaveCount(0);

  await expect(page.getByRole('heading', { name: /you're on pro/i })).toBeVisible({ timeout: 20_000 });
});

test('a stale pro plan self-heals into a lock on a 403', async ({ page }) => {
  // localStorage says Pro, the server disagrees (cancelled on another device).
  await page.addInitScript(() => {
    try {
      localStorage.setItem('access_token', 'app-access-token');
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: {
              id: 'freelancer-1', email: 'f@example.com', name: 'f', role: 'freelancer',
              plan: 'pro', walletAddress: '', kycStatus: 'approved',
              createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
            },
            isAuthenticated: true,
          },
          version: 0,
        }),
      );
    } catch {
      // Ignore initial frame security errors
    }
  });

  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'freelancer-1', email: 'f@example.com', name: 'f', role: 'freelancer',
          plan: 'free', walletAddress: '', kycStatus: 'approved', createdAt, updatedAt: createdAt,
        },
      }),
    }),
  );
  await page.route('**/api/notifications/stream', (route) => route.abort());

  await page.goto('/dashboard/freelancer/recommendations');

  await expect(page.getByRole('region', { name: 'Pro feature' })).toBeVisible();
});

test('every desktop nav link is reachable from the mobile menu', async ({ page }) => {
  // The mobile drawer used to filter the nav through a hardcoded allowlist, so
  // a newly added link (/pricing) silently vanished on phones. Assert parity
  // rather than the presence of one link, so the next addition cannot regress.
  await page.setViewportSize({ width: 393, height: 850 });
  await page.goto('/');

  const desktopLinks = await page.locator('header nav a').allInnerTexts();

  await page.getByRole('button', { name: /open menu/i }).click();
  const mobileLinks = (await page.locator('[role="dialog"] a').allInnerTexts()).map((t) => t.trim());

  for (const label of desktopLinks.map((t) => t.trim()).filter(Boolean)) {
    expect(mobileLinks, `"${label}" is missing from the mobile menu`).toContain(label);
  }

  await expect(page.getByRole('link', { name: 'Pricing', exact: true })).toBeVisible();
});

test('pricing page shows real prices and the trial on a phone', async ({ page }) => {
  await page.route('**/api/billing/plans', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        billingEnabled: true,
        trialPeriodDays: 7,
        plans: [
          { id: 'free', name: 'Free', description: 'x', prices: [] },
          {
            id: 'pro', name: 'Pro', description: 'y',
            prices: [
              { interval: 'month', priceId: 'price_m', unitAmount: 2000, currency: 'usd' },
              { interval: 'year', priceId: 'price_y', unitAmount: 20000, currency: 'usd' },
            ],
          },
        ],
      }),
    }),
  );

  await page.setViewportSize({ width: 393, height: 850 });
  await page.goto('/pricing');

  await expect(page.getByText('$20')).toBeVisible();
  await expect(page.getByText(/7 days free/i)).toBeVisible();
  await expect(page.getByRole('radio', { name: /annual/i })).toBeVisible();

  // Prices come from the API, so the page can never quote a figure checkout
  // will not honour.
  await page.getByRole('radio', { name: /annual/i }).click();
  await expect(page.getByText('$200')).toBeVisible();
  await expect(page.getByText(/saves \$40 a year/i)).toBeVisible();
});

test('an unverified user cannot start checkout and is sent to verify', async ({ page }) => {
  // Verification gates the purchase itself: a live button here would only
  // produce a 403 the user cannot act on.
  await authenticate(page, 'freelancer', 'free');
  await page.route('**/api/billing/plans', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      billingEnabled: true, trialPeriodDays: 7,
      plans: [{ id: 'free', name: 'Free', description: 'x', prices: [] },
              { id: 'pro', name: 'Pro', description: 'y', prices: [
                { interval: 'month', priceId: 'price_m', unitAmount: 2000, currency: 'usd' }] }] }) }));
  await page.route('**/api/billing/subscription', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      plan: 'free', status: 'none', isPro: false, currentPeriodEnd: null, cancelAtPeriodEnd: false,
      manageable: false, canSubscribe: false, subscribeBlockedReason: 'kyc_unverified',
      trialEligible: false, trialDays: 7, trialIneligibleReason: 'kyc_unverified' }) }));

  const checkoutCalls = countRequests(page, '/api/billing/checkout-session');

  await page.setViewportSize({ width: 393, height: 850 });
  await page.goto('/dashboard/freelancer/billing');

  const upgrade = page.getByRole('button', { name: /upgrade to pro/i });
  await expect(upgrade).toBeVisible();
  await expect(upgrade).toBeDisabled();

  await expect(page.getByText(/complete identity verification to subscribe/i)).toBeVisible();
  const verify = page.getByRole('link', { name: /verify identity/i });
  await expect(verify).toBeVisible();
  await expect(verify).toHaveAttribute('href', '/dashboard/freelancer/verification');

  expect(checkoutCalls.total).toBe(0);
});

test('a verified first-time user is offered the trial', async ({ page }) => {
  await authenticate(page, 'freelancer', 'free');
  await page.route('**/api/billing/plans', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      billingEnabled: true, trialPeriodDays: 7,
      plans: [{ id: 'free', name: 'Free', description: 'x', prices: [] },
              { id: 'pro', name: 'Pro', description: 'y', prices: [
                { interval: 'month', priceId: 'price_m', unitAmount: 2000, currency: 'usd' }] }] }) }));
  await page.route('**/api/billing/subscription', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      plan: 'free', status: 'none', isPro: false, currentPeriodEnd: null, cancelAtPeriodEnd: false,
      manageable: false, canSubscribe: true, subscribeBlockedReason: null,
      trialEligible: true, trialDays: 7, trialIneligibleReason: null }) }));

  await page.goto('/dashboard/freelancer/billing');

  const cta = page.getByRole('button', { name: /start 7-day free trial/i });
  await expect(cta).toBeVisible();
  await expect(cta).toBeEnabled();
});
