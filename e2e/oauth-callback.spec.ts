import { expect, test } from '@playwright/test';

const authUser = {
  id: 'user-1',
  email: 'employer@example.com',
  role: 'employer',
  walletAddress: '',
  createdAt: '2026-08-06T00:00:00.000Z',
};

test('new OAuth user can choose a role and finish registration', async ({ page }) => {
  let callbackBody: unknown;
  let registrationBody: unknown;

  await page.route('**/auth/csrf-token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax',
      },
      body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }),
    });
  });
  await page.route('**/api/auth/oauth/callback', async (route) => {
    callbackBody = route.request().postDataJSON();
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'registration_required' }),
    });
  });
  await page.route('**/api/auth/oauth/register', async (route) => {
    registrationBody = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        user: authUser,
        accessToken: 'app-access-token',
        refreshToken: 'app-refresh-token',
      }),
    });
  });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: authUser }),
    });
  });

  await page.goto('/auth/callback?userId=appwrite-user&secret=oauth-secret');
  await expect(page.getByRole('heading', { name: 'Complete your registration' })).toBeVisible();
  await page.getByRole('button', { name: /Employer/ }).click();

  await expect(page).toHaveURL(/\/dashboard\/employer$/);
  expect(callbackBody).toEqual({ access_token: 'oauth-secret' });
  expect(registrationBody).toEqual({ accessToken: 'oauth-secret', role: 'employer' });
  expect(await page.evaluate(() => localStorage.getItem('access_token'))).toBe('app-access-token');
});

test('OAuth callback without a token returns the user to sign in safely', async ({ page }) => {
  await page.goto('/auth/callback');

  await expect(page.getByRole('heading', { name: 'Unable to sign in' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/login');
});
