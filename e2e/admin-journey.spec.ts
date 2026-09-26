import { expect, test } from '@playwright/test';

test.describe('End-to-End User Journey - Admin Role & Governance Lifecycle', () => {
  const adminUser = {
    id: 'admin-governance-1',
    email: 'admin@freelancexchain.test',
    name: 'Super Admin',
    role: 'admin',
    walletAddress: '0x3333333333333333333333333333333333333333',
    kycStatus: 'approved',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  test.beforeEach(async ({ page }) => {
    // Intercept CSRF
    await page.route('**/auth/csrf-token', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'set-cookie': 'psifi.x-csrf-token=test-csrf-token; Path=/; SameSite=Lax' },
        body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }),
      }),
    );

    // Intercept Auth me
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: adminUser }),
      }),
    );

    // Intercept MFA factors
    await page.route('**/api/auth/mfa/factors', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ factors: [] }),
      }),
    );

    // Seed authenticated state in localStorage
    await page.addInitScript((user) => {
      localStorage.setItem('access_token', 'test-access-token');
      localStorage.setItem('refresh_token', 'test-refresh-token');
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: { user, isAuthenticated: true },
          version: 0,
        }),
      );
    }, adminUser);
  });

  test('admin accesses dashboard, views platform metrics, navigates disputes and audit logs', async ({ page }) => {
    // Intercept platform stats
    await page.route('**/api/admin/stats', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalUsers: 150,
          totalFreelancers: 100,
          totalEmployers: 50,
          totalProjects: 75,
          totalContracts: 60,
          totalDisputes: 2,
          totalTransactionVolume: 125000,
          activeProjects: 25,
          completedProjects: 50,
          averageProjectBudget: 2500,
        }),
      }),
    );

    // 1. Visit Admin Dashboard
    await page.goto('/dashboard/admin');
    await expect(page.locator('body')).toBeVisible();

    // 2. Visit Disputes Management Page
    await page.route('**/api/admin/disputes**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          disputes: [],
          total: 0,
          pendingCount: 0,
          resolvedCount: 0,
        }),
      }),
    );
    await page.goto('/dashboard/admin/disputes');
    await expect(page.locator('#dashboard-content').first()).toBeVisible();

    // 3. Visit User Management Page
    await page.route('**/api/admin/users**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [
            {
              id: 'user-sample-1',
              email: 'verified@example.com',
              role: 'freelancer',
              is_suspended: false,
              kyc_status: 'approved',
              kyc_verified: true,
              email_verified: true,
            },
          ],
          total: 1,
        }),
      }),
    );
    await page.goto('/dashboard/admin/users');
    await expect(page.locator('#dashboard-content').first()).toBeVisible();

    // 4. Visit Audit Logs Page
    await page.route('**/api/admin/audit-logs**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [],
          total: 0,
        }),
      }),
    );
    await page.goto('/dashboard/admin/audit-logs');
    await expect(page.locator('#dashboard-content').first()).toBeVisible();
  });
});
