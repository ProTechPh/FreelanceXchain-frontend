import { test } from './fixtures/authSetup.js';
import { expect } from '@playwright/test';
import { SettingsPage } from './pages/SettingsPage.js';

test.beforeEach(async ({ authenticateAs }) => {
  await authenticateAs('employer');
});

test('employer settings save backend email preferences and omit unsupported actions', async ({ page }) => {
  let updateBody: unknown;
  await page.route('**/api/email-preferences', async (route) => {
    if (route.request().method() === 'PATCH') {
      updateBody = route.request().postDataJSON();
      await route.fulfill({ status: 200, body: JSON.stringify({ updateBody, weeklyDigest: false }) });
      return;
    }
    await route.fulfill({ status: 200, body: JSON.stringify({ id: 'preferences-1', weeklyDigest: true }) });
  });
  
  const settingsPage = new SettingsPage(page);
  await settingsPage.goto('employer');
  expect(await settingsPage.getHeadingText()).toBe('Account settings');
  
  await settingsPage.togglePreference('weeklyDigest');
  expect(await settingsPage.getPreferenceState('weeklyDigest')).toBe('false');
  expect(updateBody).toEqual({ weekly_digest: false });
  
  expect(await settingsPage.isDeleteAccountButtonVisible()).toBe(false);
  expect(await settingsPage.isConnectWalletButtonVisible()).toBe(true);
});

test('participant sees storage quota and can delete an owned file', async ({ page }) => {
  const files = [{
    name: 'proposal.pdf',
    bucket: 'proposal_attachments',
    path: 'file-1',
    size: 1536,
    createdAt: '2026-08-06T00:00:00.000Z',
    updatedAt: '2026-08-06T00:00:00.000Z',
    publicUrl: 'https://files.example/proposal.pdf',
  }];
  let fileList = [...files];

  await page.route(/\/api\/file-management/, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/quota')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ used: 1536, limit: 10485760, percentage: 0.015, files: fileList.length }),
      });
      return;
    }

    if (method === 'DELETE') {
      fileList = [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'File deleted' }),
      });
      return;
    }

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fileList),
      });
      return;
    }

    await route.continue();
  });

  const settingsPage = new SettingsPage(page);
  await settingsPage.goto('employer');
  expect(await settingsPage.getStorageInfo()).toContain('1.5 KB');
  expect(await settingsPage.getStorageInfo()).toContain('10 MB');

  await settingsPage.deleteFile('proposal.pdf');
  expect(await settingsPage.getFileCount()).toBe(0);
});

