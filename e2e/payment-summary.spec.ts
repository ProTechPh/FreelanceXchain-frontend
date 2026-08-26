import { expect, test, type Page } from '@playwright/test';

const createdAt = '2026-08-06T00:00:00.000Z';
const freelancer = { id: 'freelancer-7', email: 'freelancer@example.com', name: 'Freelancer', role: 'freelancer', walletAddress: '0x1111111111111111111111111111111111111111', kycStatus: 'approved', createdAt, updatedAt: createdAt };

async function setup(page: Page, summary: unknown, payments: unknown) {
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('refresh_token', 'app-refresh-token');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: storedUser, isAuthenticated: true }, version: 0 }));
  }, freelancer);
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: freelancer }) }));
  await page.route('**/auth/csrf-token', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' }, body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }) }));
  await page.route('**/api/payments/summary', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(summary) }));
  await page.route(/\/api\/payments\/me(?:\?.*)?$/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payments) }));
  await page.route(/\/api\/transactions(?:\?.*)?$/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], hasMore: false, total: 0 }) }));
}

const emptyPayments = { items: [], total: 0, hasMore: false, totalEarnings: 0, totalSpent: 0 };

test('renders lifetime earnings when the totals are available', async ({ page }) => {
  await setup(page, { totalEarnings: 12.4, totalSpent: 0, available: true }, emptyPayments);
  await page.goto('/dashboard/freelancer/earnings');

  await expect(page.getByText('Lifetime earned')).toBeVisible();
  await expect(page.getByText(/ETH\s*12\.4000/)).toBeVisible();
});

test('shows Unavailable, never a misleading zero, when the totals query failed', async ({ page }) => {
  // `available: false` is exactly the case the backend added the flag for.
  await setup(page, { totalEarnings: null, totalSpent: null, available: false }, emptyPayments);
  await page.goto('/dashboard/freelancer/earnings');

  const tile = page.locator('[data-slot="payment-summary-tile"]');
  await expect(tile.getByText('Unavailable')).toBeVisible();
  await expect(tile.getByText('Totals could not be calculated right now. Try again shortly.')).toBeVisible();
  // Scoped to the tile: a zero anywhere else on the page is fine, a zero *here*
  // would read as "you have earned nothing", which is the failure mode the
  // backend's `available` flag exists to prevent.
  await expect(tile.getByText(/ETH\s*0/)).toHaveCount(0);
});

test('paginates the ledger with limit and offset the API accepts', async ({ page }) => {
  const observed: string[] = [];
  const record = (id: string) => ({ id, contractId: '123e4567-e89b-12d3-a456-426614174090', milestoneId: null, payerId: 'employer-7', payeeId: freelancer.id, amount: 1, currency: 'ETH', txHash: null, status: 'completed', paymentType: 'milestone_release', createdAt });

  await setup(page, { totalEarnings: 40, totalSpent: 0, available: true }, emptyPayments);
  await page.unroute(/\/api\/payments\/me(?:\?.*)?$/);
  await page.route(/\/api\/payments\/me(?:\?.*)?$/, (route) => {
    const url = new URL(route.request().url());
    const offset = url.searchParams.get('offset') ?? '0';
    observed.push(`${url.searchParams.get('limit')}|${offset}`);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [record(`pay-${offset}`)], total: 40, hasMore: offset === '0', totalEarnings: 40, totalSpent: 0 }),
    });
  });

  await page.goto('/dashboard/freelancer/earnings');
  await expect.poll(() => observed).toContain('20|0');

  await page
    .locator('[data-slot="my-payments-ledger"]')
    .getByRole('button', { name: 'Next', exact: true })
    .click();
  await expect.poll(() => observed).toContain('20|20');
});
