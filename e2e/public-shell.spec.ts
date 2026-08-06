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
