import { expect, test } from '@playwright/test';

test.describe('End-to-End User Journey - Error Path & Boundary Protections', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept CSRF token request
    await page.route('**/auth/csrf-token', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'set-cookie': 'psifi.x-csrf-token=test-csrf-token; Path=/; SameSite=Lax' },
        body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }),
      }),
    );
  });

  test('displays clear error notification on invalid credentials and restores submit button', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      }),
    );

    await page.goto('/login');

    const emailInput = page.getByLabel('Email Address', { exact: true });
    const passwordInput = page.getByLabel('Password', { exact: true });
    const submitBtn = page.locator('form button[type="submit"]');

    await emailInput.fill('intruder@example.com');
    await passwordInput.fill('WrongPassword!');
    await submitBtn.click();

    // Verify error feedback or alert is visible
    const alertMessage = page.locator('[role="alert"]').or(page.getByText(/invalid credentials/i)).first();
    await expect(alertMessage).toBeVisible({ timeout: 10_000 });

    // Ensure button recovers to enabled state so user can fix password
    await expect(submitBtn).toBeEnabled({ timeout: 10_000 });
    await expect(submitBtn).not.toHaveAttribute('aria-busy', 'true');
  });

  test('unauthenticated visitor trying to access dashboard is redirected or blocked', async ({ page }) => {
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' }),
      }),
    );

    await page.goto('/dashboard/employer');

    // Page must either redirect to /login or show an authentication guard
    await page.waitForTimeout(1000);
    const isLoginPage = page.url().includes('/login');
    const hasSignInPrompt = (await page.getByRole('link', { name: /sign in/i }).count()) > 0;
    const hasUnauthenticatedNotice = (await page.getByText(/sign in|log in|unauthorized/i).count()) > 0;

    expect(isLoginPage || hasSignInPrompt || hasUnauthenticatedNotice).toBe(true);
  });

  test('gracefully renders error state when critical API endpoint returns HTTP 500', async ({ page }) => {
    // Authenticate user
    const mockUser = {
      id: 'employer-err-1',
      email: 'err-test@example.com',
      name: 'Test Employer',
      role: 'employer',
      walletAddress: '0x1111111111111111111111111111111111111111',
      kycStatus: 'approved',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };

    await page.addInitScript((storedUser) => {
      localStorage.setItem('access_token', 'test-access-token');
      localStorage.setItem('refresh_token', 'test-refresh-token');
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: { user: storedUser, isAuthenticated: true },
          version: 0,
        }),
      );
    }, mockUser);

    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: mockUser }),
      }),
    );
    await page.route('**/api/auth/mfa/factors', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ factors: [] }),
      }),
    );

    // Fail projects API call
    await page.route('**/api/projects**', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      }),
    );

    await page.goto('/projects');

    // Page must remain responsive and render without crashing
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Verify application navigation or main shell still exists
    await expect(page.locator('nav, main').first()).toBeVisible();
  });
});
