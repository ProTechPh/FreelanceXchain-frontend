import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/authSetup.js';

const limitedAdminPermissions = ['analytics:view', 'users:view'] as const;

async function mockCsrf(page: Page) {
  await page.route('**/auth/csrf-token', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' },
    body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }),
  }));
}

async function mockAnalytics(page: Page) {
  await page.route('**/api/admin/analytics', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      totalUsers: 0,
      totalProjects: 0,
      totalRevenue: 0,
      activeContracts: 0,
      userGrowth: 0,
      projectGrowth: 0,
      userGrowthData: [],
      projectActivityData: [],
    }),
  }));
}

test('Reject a KYC request with audit reason', async ({ page, authenticateAs }) => {
  await authenticateAs('admin', {
    id: 'kyc-admin',
    name: 'KYC Administrator',
    permissions: ['kyc:view', 'kyc:manage'],
  });
  await mockCsrf(page);

  const auditReason = 'Identity document does not match the submitted profile.';
  let status: 'completed' | 'rejected' = 'completed';
  let reviewRequest: { url: string; body: unknown } | null = null;
  const verification = {
    id: 'kyc-freelancer-2',
    user_id: 'freelancer-2',
    status,
    didit_session_id: 'session-2',
    didit_session_url: null,
    didit_workflow_id: 'workflow-1',
    decision: null,
    first_name: 'Ana',
    last_name: 'Reyes',
    date_of_birth: '1994-04-12',
    nationality: 'Philippines',
    document_type: 'Identity Card',
    document_number: 'DOC-2',
    issuing_country: 'PH',
    document_verified: true,
    liveness_passed: true,
    liveness_confidence_score: '99',
    face_matched: true,
    face_similarity_score: '98',
    ip_address: '127.0.0.1',
    ip_country_code: 'PH',
    is_vpn: false,
    is_proxy: false,
    reviewed_by: null,
    reviewed_at: null,
    admin_notes: null,
    created_at: '2026-09-30T10:00:00.000Z',
    updated_at: '2026-09-30T10:00:00.000Z',
  };

  await page.route('**/api/kyc/admin/pending', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(status === 'completed' ? [{ ...verification, status }] : []),
  }));
  await page.route('**/api/kyc/admin/status/*', (route) => {
    const requestedStatus = new URL(route.request().url()).pathname.split('/').pop();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(requestedStatus === status ? [{ ...verification, status, admin_notes: auditReason }] : []),
    });
  });
  await page.route('**/api/kyc/admin/verification/*/decision', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ verification: { ...verification, status }, images: {}, warnings: [] }),
  }));
  await page.route('**/api/kyc/admin/review/*', async (route) => {
    reviewRequest = {
      url: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON(),
    };
    status = 'rejected';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...verification, status, admin_notes: auditReason }),
    });
  });

  await page.goto('/dashboard/admin/kyc');
  await expect(page.getByText('Ana Reyes')).toBeVisible();
  await page.getByRole('button', { name: 'View Details' }).click();
  await page.getByLabel('Audit reason').fill(auditReason);
  await page.getByRole('button', { name: 'Reject', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm Rejection' }).click();

  await expect.poll(() => reviewRequest).toEqual({
    url: '/api/kyc/admin/review/kyc-freelancer-2',
    body: { decision: 'rejected', notes: auditReason },
  });
  await expect(page.getByText('Status: Rejected')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hide Details' })).toBeVisible();
});

test('Block non-admin access to admin audit logs', async ({ page, authenticateAs }) => {
  await authenticateAs('freelancer');
  await page.goto('/dashboard/admin/audit-logs');

  await expect(page).toHaveURL(/\/dashboard\/freelancer$/);
  await expect(page.getByRole('heading', { name: 'Audit logs' })).toHaveCount(0);
});

test('Block unauthorized access to admin disputes', async ({ page, authenticateAs }) => {
  await authenticateAs('employer');
  await page.goto('/dashboard/admin/disputes');

  await expect(page).toHaveURL(/\/dashboard\/employer$/);
  await expect(page.getByRole('heading', { name: 'Dispute management' })).toHaveCount(0);
});

test('Sub-admin cannot see restricted admin actions in analytics', async ({ page, authenticateAs }) => {
  await authenticateAs('admin', {
    id: 'limited-admin',
    name: 'Limited Administrator',
    permissions: [...limitedAdminPermissions],
  });
  await mockAnalytics(page);
  await page.goto('/dashboard/admin/analytics');

  await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Audit logs' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Disputes' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'System health' })).toHaveCount(0);
});

test('Hide restricted admin actions for limited permissions', async ({ page, authenticateAs }) => {
  await authenticateAs('admin', {
    id: 'limited-admin',
    name: 'Limited Administrator',
    permissions: [...limitedAdminPermissions],
  });
  await mockAnalytics(page);
  await mockCsrf(page);

  await page.route('**/api/admin/users**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      users: [{
        id: 'freelancer-1',
        email: 'dev@example.com',
        name: 'Jordan Dev',
        role: 'freelancer',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        createdAt: '2026-09-30T10:00:00.000Z',
        kycVerified: false,
        kycStatus: 'not_started',
        emailVerified: true,
        isActive: true,
        permissions: [],
      }],
      total: 1,
    }),
  }));

  await page.goto('/dashboard/admin/analytics');

  await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'KYC review' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Skills' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Support tickets' })).toHaveCount(0);

  // Navigate to user management page
  await page.goto('/dashboard/admin/users');
  await expect(page.getByRole('heading', { name: 'User management' })).toBeVisible();

  // Verify interactive action controls exist in Actions column
  const viewButton = page.getByRole('button', { name: 'View details for Jordan Dev' });
  await expect(viewButton).toBeVisible();
  const actionsButton = page.getByRole('button', { name: 'Actions for Jordan Dev' });
  await expect(actionsButton).toBeVisible();

  // Verify restricted admin mutation actions are hidden
  await expect(page.getByRole('button', { name: 'Add / Invite User' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Manage permissions for/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Suspend/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Manually verify KYC/ })).toHaveCount(0);

  // 1. Clicking View button opens detail drawer
  await viewButton.click();
  const drawer = page.getByRole('dialog', { name: /User details for Jordan Dev|Jordan Dev/ });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('Jordan Dev').first()).toBeVisible();
  await expect(drawer.getByText('dev@example.com')).toBeVisible();
  await expect(drawer.getByText('Read-only Permissions')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();

  // 2. Clicking username cell opens detail drawer
  await page.getByText('Jordan Dev').click();
  await expect(drawer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();

  // 3. Clicking user row opens detail drawer
  await page.getByRole('row', { name: /Jordan Dev/ }).click();
  await expect(drawer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
});

test('Restrict admin actions for a sub-admin with limited permissions', async ({ page, authenticateAs }) => {
  await authenticateAs('admin', {
    id: 'limited-admin',
    name: 'Limited Administrator',
    permissions: [...limitedAdminPermissions],
  });
  await mockCsrf(page);
  await page.route('**/api/admin/users**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      users: [{
        id: 'admin-2',
        email: 'reviewed-admin@example.com',
        name: 'Reviewed Administrator',
        role: 'admin',
        walletAddress: '',
        createdAt: '2026-09-30T10:00:00.000Z',
        kycVerified: false,
        kycStatus: 'not_started',
        emailVerified: true,
        isActive: true,
        permissions: ['analytics:view'],
      }],
      total: 1,
    }),
  }));

  await page.goto('/dashboard/admin/users');

  await expect(page.getByRole('heading', { name: 'User management' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add / Invite User' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Manage permissions for/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Suspend/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Manually verify KYC/ })).toHaveCount(0);
});
