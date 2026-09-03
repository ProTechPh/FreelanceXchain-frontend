import { expect, test, type Page } from '@playwright/test';

/**
 * Mobile responsiveness contract.
 *
 * Runs under the `mobile-320` and `mobile-393` projects. The rules asserted here
 * are the ones `skill.md` already states: the page body never scrolls sideways,
 * and navigation is always reachable.
 */

const PUBLIC_ROUTES = [
  '/',
  '/projects',
  '/freelancers',
  '/employers',
  '/how-it-works',
  '/leaderboard',
  '/faqs',
  '/help',
  '/blog',
  '/news',
  '/contact',
  '/about',
  '/status',
  '/terms',
  '/privacy',
];

const DASHBOARD_ROUTES: Record<'freelancer' | 'employer', string[]> = {
  freelancer: [
    '',
    '/contracts',
    '/proposals',
    '/earnings',
    '/transactions',
    '/messages',
    '/notifications',
    '/portfolio',
    '/profile',
    '/projects',
    '/reputation',
    '/saved',
    '/settings',
    '/verification',
    '/activity',
    '/disputes',
  ],
  employer: [
    '',
    '/contracts',
    '/projects',
    '/transactions',
    '/messages',
    '/notifications',
    '/profile',
    '/reputation',
    '/saved',
    '/settings',
    '/verification',
    '/activity',
    '/disputes',
  ],
};

const ADMIN_ROUTES = [
  '',
  '/analytics',
  '/audit-logs',
  '/disputes',
  '/email',
  '/kyc',
  '/notifications',
  '/skills',
  '/system',
  '/users',
];

async function authenticateParticipant(page: Page, role: 'freelancer' | 'employer' | 'admin') {
  const user = {
    id: `${role}-1`,
    email: `${role}@example.com`,
    name: role === 'freelancer' ? 'Maria Santos' : role === 'employer' ? 'TechVentures Inc.' : 'Admin',
    role,
    walletAddress: '0x08dfcf184486bd3d8e1bc34da8d520a2689a7828',
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
    body: JSON.stringify({ count: 7 }),
  }));
  await page.route('**/api/notifications/stream', (route) => route.abort());
}

/** The document must never be wider than the viewport it is rendered in. */
async function expectNoHorizontalScroll(page: Page, label: string) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth - el.clientWidth;
  });
  expect(overflow, `${label} scrolls horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
}

test.describe('public surfaces', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} does not scroll horizontally`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectNoHorizontalScroll(page, route);
    });
  }
});

test.describe('dashboard surfaces', () => {
  for (const role of ['freelancer', 'employer'] as const) {
    for (const path of DASHBOARD_ROUTES[role]) {
      const route = `/dashboard/${role}${path}`;
      test(`${route} does not scroll horizontally`, async ({ page }) => {
        await authenticateParticipant(page, role);
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        await expectNoHorizontalScroll(page, route);
      });
    }
  }

  // Admin carries the heaviest layouts (a three-pane mail view, a six-column
  // audit table, a twelve-bar chart), so it gets the same contract.
  for (const path of ADMIN_ROUTES) {
    const route = `/dashboard/admin${path}`;
    test(`${route} does not scroll horizontally`, async ({ page }) => {
      await authenticateParticipant(page, 'admin');
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectNoHorizontalScroll(page, route);
    });
  }

  // Folder switching used to be impossible on a phone: the rail was `hidden sm:block`
  // with nothing in its place.
  test('admin mail folders are reachable on a phone', async ({ page }) => {
    await authenticateParticipant(page, 'admin');
    await page.goto('/dashboard/admin/email');
    await expect(page.getByRole('button', { name: /Inbox/ })).toBeVisible();
  });

  // The regression this suite exists for: the header's controls used to overlap,
  // so the point at the centre of the menu button belonged to the search button
  // and the drawer could not be opened at all.
  test('the navigation menu button owns its own centre point', async ({ page }) => {
    await authenticateParticipant(page, 'freelancer');
    await page.goto('/dashboard/freelancer');

    const menu = page.getByRole('button', { name: 'Open navigation menu' });
    await expect(menu).toBeVisible();

    const box = await menu.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(40);
    expect(box!.height).toBeGreaterThanOrEqual(40);

    const ownsCentre = await page.evaluate(({ x, y, width, height }) => {
      const hit = document.elementFromPoint(x + width / 2, y + height / 2);
      return hit?.closest('button')?.getAttribute('aria-label') ?? null;
    }, box!);
    expect(ownsCentre).toBe('Open navigation menu');
  });

  test('the drawer opens and exposes the dashboard navigation', async ({ page }) => {
    await authenticateParticipant(page, 'freelancer');
    await page.goto('/dashboard/freelancer');

    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const drawer = page.getByRole('dialog', { name: 'Dashboard navigation' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Messages' })).toBeVisible();

    const { drawerWidth, viewportWidth } = await drawer.evaluate((el) => ({
      drawerWidth: el.getBoundingClientRect().width,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(drawerWidth, 'drawer leaves no room to tap away').toBeLessThan(viewportWidth);
  });

  test('the search field opens in its own row instead of over the menu button', async ({ page }) => {
    await authenticateParticipant(page, 'freelancer');
    await page.goto('/dashboard/freelancer');

    const toggle = page.getByRole('button', { name: 'Search projects' }).first();
    await toggle.click();

    // The `sm`+ field is also in the DOM (hidden), so target the phone row's own.
    const field = page.locator('#dashboard-marketplace-search-mobile');
    await expect(field).toBeVisible();
    await expect(field).toBeFocused();
    await expectNoHorizontalScroll(page, 'dashboard with the search row open');
  });
});
