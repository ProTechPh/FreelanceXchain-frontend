/**
 * Example usage for NavigationComponent with Fixtures:
 * const nav = new NavigationComponent(page);
 * await nav.open();
 * await nav.navigateTo("Messages");
 */

import { test } from './fixtures/authSetup.js';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { NavigationComponent } from './pages/NavigationComponent.js';

const PUBLIC_ROUTES = [
  '/',
  '/projects',
  '/freelancers',
  '/employers',
  '/how-it-works',
  '/pricing',
  '/leaderboard',
  '/faqs',
  '/help',
  '/blog',
  '/news',
  '/contact',
  '/about',
  '/status',
  '/terms',
  '/privacy'
];

const DASHBOARD_ROUTES = {
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
    '/billing'
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
    '/billing'
  ]
};

const ADMIN_ROUTES = [
  '',
  '/analytics',
  '/audit-logs',
  '/disputes',
  '/feedback',
  '/kyc',
  '/notifications',
  '/skills',
  '/system',
  '/users'
];

async function expectNoHorizontalScroll(page, label) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  expect(overflow, `${label} scrolls horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
}

test.describe('public surfaces', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} does not scroll horizontally`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await page.locator('main, header').first().waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
      await expectNoHorizontalScroll(page, route);
    });
  }
});

test.describe('dashboard surfaces', () => {
  for (const role of ['freelancer', 'employer']) {
    for (const path of DASHBOARD_ROUTES[role]) {
      const route = `/dashboard/${role}${path}`;
      test(`${route} does not scroll horizontally`, async ({ page, authenticateAs }) => {
        await authenticateAs(role);
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded');
        await page.locator('main').first().waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
        await expectNoHorizontalScroll(page, route);
      });
    }
  }

  for (const path of ADMIN_ROUTES) {
    const route = `/dashboard/admin${path}`;
    test(`${route} does not scroll horizontally`, async ({ page, authenticateAs }) => {
      await authenticateAs('admin');
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await page.locator('main').first().waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
      await expectNoHorizontalScroll(page, route);
    });
  }

  test('the navigation menu button owns its own centre point', async ({ page, authenticateAs }) => {
    await authenticateAs('freelancer');
    await page.goto('/dashboard/freelancer');
    const nav = new NavigationComponent(page);
    expect(await nav.isMenuButtonVisible()).toBe(true);
    const box = await nav.getMenuButtonSize();
    expect(box?.width).toBeGreaterThanOrEqual(40);
    expect(box?.height).toBeGreaterThanOrEqual(40);
    expect(await nav.menuButtonOwnsCenter()).toBe(true);
  });

  test('the drawer opens and exposes the dashboard navigation', async ({ page, authenticateAs }) => {
    await authenticateAs('freelancer');
    await page.goto('/dashboard/freelancer');
    const nav = new NavigationComponent(page);
    await nav.open();
    expect(await nav.drawerFitsInViewport()).toBe(true);
    const messagesLink = await nav.getNavLinkByName('Messages');
    await expect(messagesLink).toBeVisible();
  });

  test('the search field opens in its own row instead of over the menu button', async ({ page, authenticateAs }) => {
    await authenticateAs('freelancer');
    await page.goto('/dashboard/freelancer');
    const toggle = page.getByRole('button', { name: 'Search projects' }).first();
    await toggle.click();
    const field = page.locator('#dashboard-marketplace-search-mobile');
    await expect(field).toBeVisible();
    await expect(page.getByRole('button', { name: 'Menu' }).first()).toBeVisible();
  });

  test('dashboard page should not have accessibility violations', async ({ page, authenticateAs }) => {
    await authenticateAs('freelancer');
    await page.goto('/dashboard/freelancer');
    const results = await new AxeBuilder({ page }).disableRules(['page-has-heading-one', 'landmark-one-main']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('mobile drawer navigation should be accessible', async ({ page, authenticateAs }) => {
    await authenticateAs('freelancer');
    await page.goto('/dashboard/freelancer');
    const nav = new NavigationComponent(page);
    await nav.open();
    const results = await new AxeBuilder({ page }).include('[role=\"dialog\"]').disableRules(['page-has-heading-one', 'landmark-one-main']).analyze();
    expect(results.violations).toEqual([]);
  });
});
