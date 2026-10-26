import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/authSetup.js';

const managedUser = {
  id: 'managed-user-1',
  email: 'managed@example.com',
  name: 'Managed User',
  role: 'freelancer',
  walletAddress: '',
  createdAt: '2026-10-01T00:00:00.000Z',
  kycVerified: false,
  kycStatus: 'pending',
  emailVerified: true,
  isActive: true,
  permissions: [],
};

async function mockCsrf(page: Page) {
  await page.route('**/auth/csrf-token', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'set-cookie': 'psifi.x-csrf-token=validation-token; Path=/; SameSite=Lax' },
    body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }),
  }));
}

test.beforeEach(async ({ page, authenticateAs }) => {
  await authenticateAs('admin', { name: 'Validation Administrator' });
  await mockCsrf(page);
});

test('Add user enforces field boundaries before sending a normalized request', async ({ page }) => {
  test.setTimeout(60_000);
  const created: Array<Record<string, unknown>> = [];
  await page.route('**/api/admin/users**', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      created.push(body);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { ...managedUser, id: 'created-user-1', name: body.name, email: body.email, kycStatus: 'not_started' },
          plan: 'pro',
        }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ users: [], total: 0 }) });
  });

  await page.goto('/dashboard/admin/users', { waitUntil: 'domcontentloaded' });
  const addUser = page.getByRole('button', { name: 'Add / Invite User' });
  await expect(addUser).toBeVisible();
  await addUser.click({ force: true });
  const dialog = page.getByRole('dialog', { name: 'Add or Invite User' });
  const name = dialog.getByLabel(/Full Name/);
  const email = dialog.getByLabel(/Email Address/);

  await expect(name).toHaveAttribute('minlength', '2');
  await expect(name).toHaveAttribute('maxlength', '100');
  await expect(email).toHaveAttribute('maxlength', '254');

  await name.fill('A');
  await email.fill('valid@example.com');
  await dialog.getByRole('button', { name: 'Create Account' }).click();
  expect(await name.evaluate((element: HTMLInputElement) => element.checkValidity())).toBe(false);
  expect(created).toHaveLength(0);

  await name.fill('  Boundary User  ');
  await email.fill('  BOUNDARY@EXAMPLE.COM  ');
  await dialog.getByRole('button', { name: 'Set custom password' }).click();
  const password = dialog.getByPlaceholder('Enter password (minimum 8 characters)');
  await expect(password).toHaveAttribute('minlength', '8');
  await expect(password).toHaveAttribute('maxlength', '256');
  await password.fill('1234567');
  await dialog.getByRole('button', { name: 'Create Account' }).click();
  expect(await password.evaluate((element: HTMLInputElement) => element.checkValidity())).toBe(false);
  expect(created).toHaveLength(0);

  await password.fill('12345678');
  await dialog.getByRole('button', { name: 'Create Account' }).click();

  await expect.poll(() => created).toHaveLength(1);
  expect(created[0]).toMatchObject({
    name: 'Boundary User',
    email: 'boundary@example.com',
    password: '12345678',
    role: 'freelancer',
    autoVerifyEmail: true,
    grantPro: true,
  });
});

test('Suspend and KYC verification enforce audit boundaries and update filters consistently', async ({ page }) => {
  const mutations: Array<{ url: string; body: unknown }> = [];
  await page.route('**/api/admin/users**', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      mutations.push({ url: new URL(request.url()).pathname, body: request.postDataJSON() });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ users: [managedUser], total: 1 }),
    });
  });

  await page.goto('/dashboard/admin/users');
  await page.getByRole('button', { name: 'Suspend Managed User' }).click();
  let dialog = page.getByRole('dialog', { name: 'Suspend User' });
  const suspendReason = dialog.getByLabel('Reason for suspension');
  const suspend = dialog.getByRole('button', { name: 'Suspend User' });
  await expect(suspendReason).toHaveAttribute('maxlength', '500');
  await suspendReason.fill('123456789');
  await expect(suspend).toBeDisabled();
  await expect(dialog.getByRole('alert')).toContainText('at least 10 letters or numbers');
  await suspendReason.fill('  1234567890  ');
  await expect(suspend).toBeEnabled();
  await suspend.click();

  await expect.poll(() => mutations).toContainEqual({
    url: '/api/admin/users/managed-user-1/suspend',
    body: { reason: '1234567890' },
  });

  await page.getByRole('button', { name: 'Manually verify KYC for Managed User' }).click();
  dialog = page.getByRole('dialog', { name: 'Manually Verify KYC' });
  const verifyReason = dialog.getByLabel('Audit reason');
  const verify = dialog.getByRole('button', { name: 'Verify User' });
  await expect(verifyReason).toHaveAttribute('minlength', '10');
  await expect(verifyReason).toHaveAttribute('maxlength', '500');
  await verifyReason.fill('123456789');
  await expect(verify).toBeDisabled();
  await expect(dialog.getByRole('alert')).toContainText('between 10 and 500');
  await verifyReason.fill('  Verified identity document  ');
  await verify.click();

  await expect.poll(() => mutations).toContainEqual({
    url: '/api/admin/users/managed-user-1/verify',
    body: { reason: 'Verified identity document' },
  });
  await expect(page.getByRole('button', { name: 'KYC verified' })).toBeVisible();

  await page.getByRole('button', { name: 'Pending', exact: true }).click();
  await expect(page.getByText('Managed User', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Approved', exact: true }).click();
  await expect(page.getByText('Managed User', { exact: true }).first()).toBeVisible();
});
