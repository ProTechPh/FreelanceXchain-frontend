import { expect, test } from '@playwright/test';

test('public landing page exposes primary marketplace navigation', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Decentralize Your Freelance Career' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse Projects' }).first()).toHaveAttribute(
    'href',
    '/projects',
  );
  await expect(page.getByRole('link', { name: 'Find Talent' }).first()).toHaveAttribute(
    'href',
    '/freelancers',
  );
});

test('landing hero uses a compact escrow preview on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  const hero = page.getByRole('region', { name: 'Freelance marketplace introduction' });
  await expect(page.getByRole('region', { name: 'Mobile escrow workflow preview' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Interactive contract workspace preview' })).toBeHidden();

  const heroBox = await hero.boundingBox();
  expect(heroBox?.height).toBeLessThan(1_500);
});

test('landing hero keeps the full contract workspace on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1_280, height: 900 });
  await page.goto('/');

  await expect(page.getByRole('region', { name: 'Interactive contract workspace preview' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Mobile escrow workflow preview' })).toBeHidden();
});

test('public navbar does not nest interactive controls', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('a button')).toHaveCount(0);
});

test('public navbar icon actions keep a visible keyboard focus indicator', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Theme:/ })).toBeVisible();

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: /Theme:/ })).toBeFocused();

  const themeOutline = await page.getByRole('button', { name: /Theme:/ }).evaluate(
    (element) => getComputedStyle(element).outlineStyle,
  );
  expect(themeOutline).not.toBe('none');

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Open search dialog' })).toBeFocused();

  const searchOutline = await page.getByRole('button', { name: 'Open search dialog' }).evaluate(
    (element) => getComputedStyle(element).outlineStyle,
  );
  expect(searchOutline).not.toBe('none');
});

test('final marketplace CTA uses its high-contrast foreground palette', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');

    const heading = page.getByRole('heading', { name: /Ready to hire or get hired/ });
    await heading.scrollIntoViewIfNeeded();

    const colors = await heading.evaluate((element) => {
      const parseColor = (value: string) => {
        if (value.startsWith('#')) {
          const rawHex = value.slice(1);
          const hex = rawHex.length === 3
            ? rawHex.split('').map((channel) => `${channel}${channel}`).join('')
            : rawHex;
          return hex.match(/.{2}/g)?.map((channel) => Number.parseInt(channel, 16)) ?? [];
        }

        return value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
      };

      const rootStyles = getComputedStyle(document.documentElement);
      const accent = element.querySelector('span');
      const darkTheme = document.documentElement.classList.contains('dark');

      return {
        heading: parseColor(getComputedStyle(element).color),
        expectedHeading: parseColor(
          rootStyles.getPropertyValue(darkTheme ? '--foreground' : '--primary-foreground').trim(),
        ),
        accent: accent ? parseColor(getComputedStyle(accent).color) : [],
        expectedAccent: parseColor(
          rootStyles.getPropertyValue(darkTheme ? '--primary' : '--primary-subtle').trim(),
        ),
      };
    });

    expect(colors.heading).toEqual(colors.expectedHeading);
    expect(colors.accent).toEqual(colors.expectedAccent);
  }
});

test('authenticated user sees dashboard navigation instead of sign in or get started on landing page', async ({ page }) => {
  const user = {
    id: 'user-freelancer-1',
    email: 'freelancer@example.com',
    name: 'Jane Freelancer',
    role: 'freelancer',
    isEmailVerified: true,
    isKycVerified: true,
    createdAt: '2026-08-01T00:00:00.000Z',
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

  await page.goto('/');

  // Should NOT show Sign in or Get Started in navbar
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeHidden();
  await expect(page.getByRole('link', { name: 'Get Started' })).toBeHidden();

  // Should show Dashboard button linking to role dashboard
  const dashboardLinks = page.getByRole('link', { name: 'Dashboard' });
  await expect(dashboardLinks.first()).toBeVisible();
  await expect(dashboardLinks.first()).toHaveAttribute('href', '/dashboard/freelancer');

  // Hero primary button should say Go to Dashboard
  const heroDashboardLink = page.getByRole('link', { name: 'Go to Dashboard' }).first();
  await expect(heroDashboardLink).toBeVisible();
  await expect(heroDashboardLink).toHaveAttribute('href', '/dashboard/freelancer');
});
