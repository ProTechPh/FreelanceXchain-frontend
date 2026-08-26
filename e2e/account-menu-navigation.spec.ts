import { expect, test, type Page } from '@playwright/test';

const utilityDestinations = [
  'Profile',
  'Verification',
  'Notifications',
  'Saved',
  'Activity',
  'Settings',
];

async function authenticateParticipant(
  page: Page,
  role: 'freelancer' | 'employer',
  email = `${role}@example.com`,
) {
  const user = {
    id: `${role}-1`,
    email,
    name: role,
    role,
    walletAddress: '',
    kycStatus: 'approved',
    createdAt: '2026-08-06T00:00:00.000Z',
    updatedAt: '2026-08-06T00:00:00.000Z',
  };
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
  await page.route('**/api/notifications/unread-count', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ count: 0 }),
  }));
  await page.route('**/api/notifications/stream', (route) => route.abort());
  await page.route('**/api/audit-logs/me?*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ logs: [] }),
  }));
}

for (const role of ['freelancer', 'employer'] as const) {
  test(`${role} account utilities live in the avatar menu instead of the sidebar`, async ({ page }) => {
    await authenticateParticipant(page, role);
    await page.goto(`/dashboard/${role}/activity`);

    const sidebar = page.locator('aside nav');
    for (const destination of utilityDestinations) {
      await expect(sidebar.getByRole('link', { name: destination, exact: true })).toHaveCount(0);
    }

    await page.getByRole('button', { name: 'Open account menu' }).click();
    for (const destination of utilityDestinations) {
      await expect(page.getByRole('menuitem', { name: destination, exact: true })).toBeVisible();
    }

    await page.getByRole('menuitem', { name: 'Saved', exact: true }).click();
    await expect(page).toHaveURL(`/dashboard/${role}/saved`);
  });
}

test('a long email ellipsizes inside the fixed-width account menu', async ({ page }) => {
  // The menu is a fixed width, so an address wider than it must show an ellipsis
  // rather than clip mid-character (which read as a rendering bug).
  const email = 'freelancer1@demo.freelancexchange.com';
  await authenticateParticipant(page, 'freelancer', email);
  await page.goto('/dashboard/freelancer/activity');

  await page.getByRole('button', { name: 'Open account menu' }).click();
  const address = page.getByTitle(email);
  await expect(address).toBeVisible();

  const box = await address.evaluate((el) => ({
    overflowing: el.scrollWidth > el.clientWidth,
    textOverflow: getComputedStyle(el).textOverflow,
    whiteSpace: getComputedStyle(el).whiteSpace,
  }));
  expect(box.overflowing).toBe(true);
  expect(box.textOverflow).toBe('ellipsis');
  expect(box.whiteSpace).toBe('nowrap');

  // And it must stay inside the menu rather than spilling past its edge.
  const menuBox = (await page.locator('[data-slot="dropdown-menu-content"]').boundingBox())!;
  const addressBox = (await address.boundingBox())!;
  expect(addressBox.x + addressBox.width).toBeLessThanOrEqual(menuBox.x + menuBox.width + 1);
});
