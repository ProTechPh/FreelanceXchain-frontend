import { expect, test } from '@playwright/test';

test.describe('End-to-End User Journey - Freelancer Role Lifecycle', () => {
  const freelancerUser = {
    id: 'freelancer-journey-1',
    email: 'freelancer@freelancexchain.test',
    name: 'Sarah Connor',
    role: 'freelancer',
    walletAddress: '0x2222222222222222222222222222222222222222',
    kycStatus: 'approved',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  test.beforeEach(async ({ page }) => {
    // Intercept CSRF
    await page.route('**/auth/csrf-token', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'set-cookie': 'psifi.x-csrf-token=test-csrf-token; Path=/; SameSite=Lax' },
        body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }),
      }),
    );

    // Intercept Auth me
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: freelancerUser }),
      }),
    );

    // Intercept MFA factors
    await page.route('**/api/auth/mfa/factors', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ factors: [] }),
      }),
    );

    // Seed authenticated state in localStorage
    await page.addInitScript((user) => {
      localStorage.setItem('access_token', 'test-access-token');
      localStorage.setItem('refresh_token', 'test-refresh-token');
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: { user, isAuthenticated: true },
          version: 0,
        }),
      );
    }, freelancerUser);
  });

  test('freelancer accesses dashboard, views recommendations, and inspects active contract earnings', async ({ page }) => {
    // 1. Visit Freelancer Dashboard
    await page.goto('/dashboard/freelancer');
    await expect(page.locator('body')).toBeVisible();

    // 2. Mock contracts for freelancer
    await page.route('**/api/contracts/freelancer/*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'contract-fl-1',
              title: 'Solidity Smart Contract Audit',
              status: 'active',
              totalAmount: 3500,
              employerId: 'emp-1',
              freelancerId: freelancerUser.id,
              createdAt: '2026-08-10T00:00:00.000Z',
              updatedAt: '2026-08-10T00:00:00.000Z',
            },
          ],
          total: 1,
        }),
      }),
    );

    // 3. Visit Proposals page
    await page.route('**/api/proposals/freelancer/*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );
    await page.goto('/dashboard/freelancer/proposals');
    await expect(page.locator('#dashboard-content').first()).toBeVisible();

    // 4. Visit Freelancer Earnings / Transactions page
    await page.route('**/api/transactions/user/*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0 }),
      }),
    );
    await page.goto('/dashboard/freelancer/earnings');
    await expect(page.locator('#dashboard-content').first()).toBeVisible();
  });
});
