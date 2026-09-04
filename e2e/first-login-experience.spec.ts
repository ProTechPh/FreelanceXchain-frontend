import { expect, test, type Page } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

const createdAt = '2026-09-04T00:00:00.000Z';

function buildUser(id = 'freelancer-new', role: 'freelancer' | 'employer' = 'freelancer') {
  return {
    id,
    email: `${id}@example.com`,
    name: role === 'freelancer' ? 'New Freelancer' : 'New Employer',
    role,
    walletAddress: '',
    emailVerification: true,
    authProvider: 'email',
    createdAt,
    updatedAt: createdAt,
  } as const;
}

async function mockAuthenticatedShell(page: Page, user: ReturnType<typeof buildUser>) {
  await page.route('**/auth/csrf-token', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' },
    body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }),
  }));
  await page.route('**/api/auth/login', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user, accessToken: 'app-access-token', refreshToken: 'app-refresh-token' }),
  }));
  await page.route('**/api/auth/logout', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true }),
  }));
  await page.route('**/api/auth/me', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user }),
  }));
  await page.route('**/api/notifications/unread-count', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ count: 0 }),
  }));
  await page.route('**/api/notifications/stream', (route) => route.abort());
}

const tourDialog = (page: Page) => page.getByRole('dialog').filter({
  has: page.getByRole('button', { name: 'Skip tour' }),
});

async function signInWithEmail(page: Page, user: ReturnType<typeof buildUser>) {
  await page.goto('/login');
  await page.getByLabel('Email Address', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('StrongPass1!');
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/${user.role}$`));
}

test('email login explains KYC before starting first-run onboarding', async ({ page }) => {
  const user = buildUser();
  await mockAuthenticatedShell(page, user);

  await signInWithEmail(page, user);
  const reminder = page.getByRole('dialog', { name: 'Verify your identity to unlock all features' });
  await expect(reminder).toBeVisible();
  await expect(tourDialog(page)).toHaveCount(0);

  await reminder.getByRole('button', { name: 'Do it later' }).click();
  await expect(reminder).toHaveCount(0);
  await expect(tourDialog(page)).toBeVisible();
});

test('verify identity opens the role-specific verification page without flashing the tour', async ({ page }) => {
  const user = buildUser('employer-new', 'employer');
  await mockAuthenticatedShell(page, user);
  await page.route('**/api/kyc/status', (route) => route.fulfill({
    status: 404,
    contentType: 'application/json',
    body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'No KYC verification found' } }),
  }));
  await page.route('**/api/kyc/history', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }));

  await signInWithEmail(page, user);
  const reminder = page.getByRole('dialog', { name: 'Verify your identity to unlock all features' });
  await reminder.getByRole('button', { name: 'Verify identity' }).click();

  await expect(page).toHaveURL(/\/dashboard\/employer\/verification$/);
  await expect(page.getByRole('heading', { name: 'Identity verification' })).toBeVisible();
  await expect(tourDialog(page)).toHaveCount(0);
});

test('dismissal lasts through reload but resets after logout and the next login', async ({ page }) => {
  const user = buildUser();
  await mockAuthenticatedShell(page, user);
  await signInWithEmail(page, user);

  const reminder = page.getByRole('dialog', { name: 'Verify your identity to unlock all features' });
  await reminder.getByRole('button', { name: 'Do it later' }).click();
  await tourDialog(page).getByRole('button', { name: 'Skip tour' }).click();
  await page.reload();
  await expect(reminder).toHaveCount(0);
  await expect(tourDialog(page)).toHaveCount(0);

  await page.getByRole('button', { name: 'Open account menu' }).click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await signInWithEmail(page, user);
  await expect(reminder).toBeVisible();
});

test('new OAuth registration receives the same KYC-first onboarding sequence', async ({ page }) => {
  const user = buildUser('oauth-employer', 'employer');
  await mockAuthenticatedShell(page, user);
  await page.route('**/api/auth/oauth/callback', (route) => route.fulfill({
    status: 202,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'registration_required', access_token: 'oauth-secret' }),
  }));
  await page.route('**/api/auth/oauth/register', (route) => route.fulfill({
    status: 201,
    contentType: 'application/json',
    body: JSON.stringify({ user, accessToken: 'app-access-token', refreshToken: 'app-refresh-token' }),
  }));

  await page.goto('/auth/callback?userId=appwrite-user&secret=oauth-secret');
  await page.getByRole('button', { name: /Employer/ }).click();

  await expect(page).toHaveURL(/\/dashboard\/employer$/);
  const reminder = page.getByRole('dialog', { name: 'Verify your identity to unlock all features' });
  await expect(reminder).toBeVisible();
  await expect(tourDialog(page)).toHaveCount(0);
  await reminder.getByRole('button', { name: 'Do it later' }).click();
  await expect(tourDialog(page)).toBeVisible();
});

test('a second account with the same role receives its own onboarding tour', async ({ page }) => {
  const user = { ...buildUser('freelancer-2'), kycStatus: 'approved' as const };
  await page.addInitScript(({ storedUser, version }) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('refresh_token', 'app-refresh-token');
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { user: storedUser, isAuthenticated: true },
      version: 0,
    }));
    localStorage.setItem('onboarding-tour', JSON.stringify({
      state: {
        progressByUser: {
          'freelancer-1': { freelancer: { completedVersion: version } },
        },
      },
      version: 1,
    }));
  }, { storedUser: user, version: 1 });
  await mockAuthenticatedShell(page, user);

  await page.goto('/dashboard/freelancer');
  await expect(tourDialog(page)).toBeVisible();
});

test('the KYC reminder stays usable from 320px through desktop widths', async ({ page }) => {
  const user = buildUser();
  await mockAuthenticatedShell(page, user);
  await signInWithEmail(page, user);

  const reminder = page.getByRole('dialog', { name: 'Verify your identity to unlock all features' });
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 768, height: 720 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(reminder.getByRole('button', { name: 'Do it later' })).toBeVisible();
    await expect(reminder.getByRole('button', { name: 'Verify identity' })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `reminder overflows at ${viewport.width}px`).toBeLessThanOrEqual(1);
  }

  await page.keyboard.press('Escape');
  await expect(reminder).toHaveCount(0);
  await expect(tourDialog(page)).toBeVisible();
});
