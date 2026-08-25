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
  await page.route('**/api/email-preferences', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(preferences) }));
  await page.route('**/api/file-management/quota', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ used: 0, limit: 104857600, percentage: 0, files: 0 }) }));
  await page.route('**/api/file-management', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
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

test('participant sees storage quota and can delete an owned file', async ({ page }) => {
  let files = [{ name: 'proposal.pdf', bucket: 'proposal_attachments', path: 'file-1', size: 1536, createdAt: user.createdAt, updatedAt: user.updatedAt, publicUrl: 'https://files.example/proposal.pdf' }];
  let deleteCount = 0;
  await page.route('**/api/file-management/quota', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ used: files.length ? 1536 : 0, limit: 104857600, percentage: files.length ? 0.0015 : 0, files: files.length }) }));
  await page.route('**/api/file-management', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(files) }));
  await page.route('**/api/file-management/proposal_attachments/file-1', async (route) => {
    deleteCount += 1;
    files = [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'File deleted' }) });
  });
  page.on('dialog', (dialog) => dialog.accept());

  await page.goto('/dashboard/employer/settings');
  await expect(page.getByText('proposal.pdf')).toBeVisible();
  await expect(page.getByText('1.5 KB · proposal attachments')).toBeVisible();
  await page.getByRole('button', { name: 'Delete proposal.pdf' }).click();
  await expect(page.getByText('File deleted.')).toBeVisible();
  await expect(page.getByText('No proposal or portfolio files stored.')).toBeVisible();
  expect(deleteCount).toBe(1);
});

test('participant reviews personal audit activity', async ({ page }) => {
  await page.route('**/api/audit-logs/me?*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ logs: [{ id: 'log-1', user_id: user.id, actor_id: user.id, action: 'wallet_updated', resource_type: 'user', resource_id: user.id, payload: {}, ip_address: '127.0.0.1', user_agent: 'browser', status: 'success', error_message: null, created_at: user.createdAt }] }) }));

  await page.goto('/dashboard/employer/activity');
  await expect(page.getByRole('heading', { name: 'Activity log' })).toBeVisible();
  await expect(page.getByText('Wallet Updated')).toBeVisible();
  await page.getByLabel('Status').selectOption('failure');
  await expect(page.getByText('No activity matches these filters')).toBeVisible();
});
