import { expect, test } from '@playwright/test';

const user = {
  id: 'user-1',
  email: 'employer@example.com',
  name: 'Employer',
  role: 'employer',
  walletAddress: '',
  createdAt: '2026-08-06T00:00:00.000Z',
  updatedAt: '2026-08-06T00:00:00.000Z',
};

const preferences = {
  id: 'preferences-1',
  userId: 'user-1',
  proposalReceived: true,
  proposalAccepted: true,
  milestoneUpdates: true,
  paymentNotifications: true,
  disputeNotifications: true,
  marketingEmails: false,
  weeklyDigest: true,
  createdAt: '2026-08-06T00:00:00.000Z',
  updatedAt: '2026-08-06T00:00:00.000Z',
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('refresh_token', 'app-refresh-token');
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { user: storedUser, isAuthenticated: true },
      version: 0,
    }));
  }, user);
  await page.route('**/api/auth/me', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user }),
  }));
  await page.route('**/api/auth/mfa/factors', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ factors: [] }),
  }));
  await page.route('**/auth/csrf-token', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' },
    body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }),
  }));
});

test('employer settings save backend email preferences and omit unsupported actions', async ({ page }) => {
  let updateBody: unknown;
  await page.route('**/api/email-preferences', async (route) => {
    if (route.request().method() === 'PATCH') {
      updateBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...preferences, weeklyDigest: false }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(preferences) });
  });

  await page.goto('/dashboard/employer/settings');
  await expect(page.getByRole('heading', { name: 'Account settings' })).toBeVisible();
  await page.getByRole('switch', { name: 'Weekly digest emails' }).click();

  await expect(page.getByRole('switch', { name: 'Weekly digest emails' })).toHaveAttribute('aria-checked', 'false');
  expect(updateBody).toEqual({ weekly_digest: false });
  await expect(page.getByRole('button', { name: /Delete Account/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Connect wallet/i })).toBeVisible();
});
