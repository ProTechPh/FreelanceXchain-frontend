import { expect, test } from '@playwright/test';

test('user can submit a new password from an Appwrite recovery link', async ({ page }) => {
  let requestBody: unknown;
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
  await page.route('**/api/auth/reset-password', async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Password updated successfully' }),
    });
  });

  await page.goto('/reset-password?userId=user-1&secret=recovery-secret');
  await page.getByLabel('New password', { exact: true }).fill('StrongPass1!');
  await page.getByLabel('Confirm new password').fill('StrongPass1!');
  await page.getByRole('button', { name: 'Update password' }).click();

  await expect(page.getByRole('heading', { name: 'Password updated' })).toBeVisible();
  expect(requestBody).toEqual({
    accessToken: 'recovery-secret',
    password: 'StrongPass1!',
  });
});

test('invalid recovery links explain how to request a replacement', async ({ page }) => {
  await page.goto('/reset-password');

  await expect(page.getByText('This reset link is missing its recovery token. Request a new email to continue.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Update password' })).toBeDisabled();
  await expect(page.getByRole('link', { name: 'Request a new reset email' })).toHaveAttribute(
    'href',
    '/forgot-password',
  );
});
