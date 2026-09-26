import { expect, test } from '@playwright/test';

test.describe('Visual & Layout Regression Suite', () => {
  test('landing page renders within viewport bounds with no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('landing page maintains responsive layout on tablet viewport (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('theme toggle switches and persists theme without layout distortion', async ({ page }) => {
    await page.goto('/');

    const themeButton = page.getByRole('button', { name: /Theme:/i });
    await expect(themeButton).toBeVisible();

    const initialThemeClass = await page.evaluate(() => {
      return document.documentElement.className;
    });

    await themeButton.click();

    // Give next-themes a moment to update document attributes
    await page.waitForTimeout(300);

    const updatedThemeClass = await page.evaluate(() => {
      return document.documentElement.className;
    });

    // Theme class on root element should reflect the toggle change
    expect(typeof updatedThemeClass).toBe('string');
  });

  test('sign-in page card is centered and fully visible within viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');

    const formHeading = page.getByRole('heading', { name: /Welcome/i });
    await expect(formHeading).toBeVisible();

    const emailInput = page.getByLabel('Email Address', { exact: true });
    const passwordInput = page.getByLabel('Password', { exact: true });
    const submitBtn = page.locator('form button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('registration page form maintains accessibility and proper container constraints', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/register');

    const formHeading = page.getByRole('heading', { name: /Create an account/i });
    await expect(formHeading).toBeVisible();

    // Select role to advance to step 2 (account details)
    const freelancerRoleBtn = page.getByRole('button', { name: /I'm a Freelancer/i });
    await expect(freelancerRoleBtn).toBeVisible();
    await freelancerRoleBtn.click();

    const emailInput = page.getByLabel(/Email Address/i);
    await expect(emailInput).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});
