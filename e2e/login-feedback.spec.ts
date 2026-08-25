import { expect, test } from '@playwright/test';

// Signing in can take a couple of seconds against a cold backend. Before this,
// the submit button gave no feedback at all, so the natural reaction was to
// click it again — against a request that was already in flight.
test('the sign-in button reports progress and blocks a second submit', async ({ page }) => {
  // Hold every API call open so the in-flight state stays observable.
  await page.route('**/api/**', async () => {
    await new Promise(() => {});
  });

  await page.goto('/login');

  const submit = page.locator('form button[type="submit"]');
  await expect(submit).toBeEnabled();
  await expect(submit).toContainText(/sign in/i);

  await page.getByLabel('Email Address', { exact: true }).fill('alex@example.com');
  await page.getByLabel('Password', { exact: true }).fill('hunter2hunter2');
  await submit.click();

  await expect(submit).toHaveAttribute('aria-busy', 'true');
  await expect(submit).toBeDisabled();
  await expect(submit).toContainText(/signing in/i);
  await expect(submit.locator('svg.animate-spin')).toBeVisible();

  // The alternate sign-in routes all navigate away; racing them against an
  // in-flight login is how you end up half-authenticated on the wrong page.
  await expect(page.getByRole('button', { name: /^google$/i })).toBeDisabled();
  await expect(page.getByRole('button', { name: /^github$/i })).toBeDisabled();
  await expect(page.getByRole('button', { name: /email code or magic link/i })).toBeDisabled();
});

test('a failed sign-in returns the button to its normal state', async ({ page }) => {
  await page.route('**/auth/csrf-token', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ cookieName: 'x' }) }),
  );
  await page.route('**/api/auth/login', (r) =>
    r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Invalid credentials' }) }),
  );

  await page.goto('/login');
  const submit = page.locator('form button[type="submit"]');

  await page.getByLabel('Email Address', { exact: true }).fill('alex@example.com');
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await submit.click();

  // The user must be able to correct the password and try again.
  await expect(submit).toBeEnabled({ timeout: 10_000 });
  await expect(submit).toContainText(/sign in/i);
  await expect(submit).not.toHaveAttribute('aria-busy', 'true');
});
