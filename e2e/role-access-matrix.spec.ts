import { expect, test } from './fixtures/authSetup';

test.describe('dashboard role access matrix', () => {
  test('freelancer can open only the freelancer dashboard', async ({ page, authenticateAs }) => {
    await authenticateAs('freelancer');

    await page.goto('/dashboard/freelancer', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#dashboard-content')).toBeVisible();

    await page.goto('/dashboard/employer', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'This page is on your employer side' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Switch to employer' })).toBeVisible();

    await page.goto('/dashboard/admin', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/dashboard\/freelancer$/);
    await expect(page.locator('#dashboard-content')).toBeVisible();
  });

  test('employer can open only the employer dashboard', async ({ page, authenticateAs }) => {
    await authenticateAs('employer');

    await page.goto('/dashboard/employer', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#dashboard-content')).toBeVisible();

    await page.goto('/dashboard/freelancer', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'This page is on your freelancer side' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Switch to freelancer' })).toBeVisible();

    await page.goto('/dashboard/admin', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/dashboard\/employer$/);
    await expect(page.locator('#dashboard-content')).toBeVisible();
  });

  test('admin cannot open participant dashboards', async ({ page, authenticateAs }) => {
    await authenticateAs('admin');

    await page.goto('/dashboard/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#dashboard-content')).toBeVisible();

    for (const participantRole of ['freelancer', 'employer'] as const) {
      await page.goto(`/dashboard/${participantRole}`, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/dashboard\/admin$/);
      await expect(page.locator('#dashboard-content')).toBeVisible();
    }
  });
});
