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

  test('admin creates a user with the Pro plan switched on or off', async ({ page }) => {
    const created: Array<Record<string, unknown>> = [];
    await page.route('**/api/admin/users**', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as Record<string, unknown>;
        created.push(body);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: `u-${created.length}`, email: body.email, name: body.name, role: body.role, walletAddress: '', createdAt: '2026-09-01T00:00:00.000Z', kycVerified: false, kycStatus: 'not_started', emailVerified: true, isActive: true, permissions: [] },
            plan: body.grantPro === false ? 'free' : 'pro',
          }),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ users: [], total: 0 }) });
    });

    await page.goto('/dashboard/admin/users');
    const openDialog = async () => {
      await page.getByRole('button', { name: 'Add / Invite User' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('switch', { name: 'Pro plan' })).toBeChecked();
      return dialog;
    };

    // Default: on.
    let dialog = await openDialog();
    await dialog.getByLabel(/Full Name/).fill('Pro Person');
    await dialog.getByLabel(/Email Address/).fill('pro@example.com');
    await dialog.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText('Pro account created for pro@example.com')).toBeVisible();
    expect(created[0]?.grantPro).toBe(true);

    // Switched off: the account starts on Free.
    await page.keyboard.press('Escape');
    dialog = await openDialog();
    await dialog.getByLabel(/Full Name/).fill('Free Person');
    await dialog.getByLabel(/Email Address/).fill('free@example.com');
    await dialog.getByRole('switch', { name: 'Pro plan' }).click();
    await expect(dialog.getByText('Starts on the Free plan. The user can upgrade later.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText('Free account created for free@example.com')).toBeVisible();
    expect(created[1]?.grantPro).toBe(false);
  });

  test('admin edits another admin\'s permissions from the key button', async ({ page }) => {
    const kycOfficer = { id: 'admin-kyc-1', email: 'kyc@email.com', name: 'kyc officer', role: 'admin', walletAddress: '', createdAt: '2026-09-27T00:00:00.000Z', kycVerified: false, kycStatus: 'not_started', emailVerified: false, isActive: true, permissions: ['kyc:view', 'kyc:manage'] };
    let saved: unknown = null;
    await page.route('**/api/admin/users**', async (route) => {
      const request = route.request();
      if (request.method() === 'PATCH' || request.method() === 'PUT') {
        saved = request.postDataJSON();
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...kycOfficer, permissions: (saved as { permissions: string[] }).permissions }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ users: [kycOfficer], total: 1 }) });
    });

    await page.goto('/dashboard/admin/users');
    await page.getByRole('button', { name: 'Manage permissions for kyc officer' }).click();
    const dialog = page.getByRole('dialog', { name: 'Admin Permissions' });
    await expect(dialog.getByText('2 of 12 permissions active')).toBeVisible();

    // The dialog uses its full width and the footer stays inside it.
    const box = await dialog.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(600);
    const footerBox = await dialog.getByRole('button', { name: 'Save permissions' }).boundingBox();
    expect((footerBox?.x ?? 0) + (footerBox?.width ?? 0)).toBeLessThanOrEqual((box?.x ?? 0) + (box?.width ?? 0));

    // Clicking anywhere on a permission card toggles it.
    await dialog.getByText('Inspect user submissions', { exact: false }).click();
    await expect(dialog.getByText('1 of 12 permissions active')).toBeVisible();
    await dialog.getByRole('button', { name: 'Save permissions' }).click();
    await expect(page.getByText('Updated permissions for kyc officer')).toBeVisible();
    expect(JSON.stringify(saved)).toContain('kyc:manage');
    expect(JSON.stringify(saved)).not.toContain('kyc:view');
  });
});
