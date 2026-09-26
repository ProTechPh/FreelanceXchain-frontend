import { expect, test } from '@playwright/test';

test.describe('End-to-End User Journey - Happy Path Marketplace Lifecycle', () => {
  const contractId = 'c1234567-89ab-cdef-0123-456789abcdef';
  const employerUser = {
    id: 'employer-user-1',
    email: 'employer@freelancexchain.test',
    name: 'Tech Ventures CEO',
    role: 'employer',
    walletAddress: '0x1111111111111111111111111111111111111111',
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
        body: JSON.stringify({ user: employerUser }),
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
  });

  test('complete happy path: visitor lands -> logs in -> views dashboard -> navigates contract workspace', async ({ page }) => {
    // 1. Visit Landing Page
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 2. Navigate to Login Page
    await page.getByRole('link', { name: /sign in/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible();

    // Intercept login endpoint
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: employerUser,
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
        }),
      }),
    );

    // 3. Submit Login Credentials
    await page.getByLabel('Email Address', { exact: true }).fill(employerUser.email);
    await page.getByLabel('Password', { exact: true }).fill('StrongPassword123!');
    await page.locator('form button[type="submit"]').click();

    // 4. Authenticated State Setup for Dashboard
    await page.addInitScript((storedUser) => {
      localStorage.setItem('access_token', 'test-access-token');
      localStorage.setItem('refresh_token', 'test-refresh-token');
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: { user: storedUser, isAuthenticated: true },
          version: 0,
        }),
      );
    }, employerUser);

    // 5. Navigate to Employer Dashboard
    await page.goto('/dashboard/employer');
    await expect(page.getByRole('heading').first()).toBeVisible();

    // 6. Contract Workspace Setup & Interception
    let contractStatus = 'pending';
    await page.route(`**/api/contracts/${contractId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contractId,
          projectId: 'project-happy-1',
          proposalId: 'proposal-happy-1',
          freelancerId: 'freelancer-happy-1',
          employerId: employerUser.id,
          escrowAddress: contractStatus === 'active' ? '0x2222222222222222222222222222222222222222' : '',
          baseAmount: 1800,
          rushFee: 200,
          totalAmount: 2000,
          status: contractStatus,
          title: 'Full Stack DApp Marketplace',
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-01T00:00:00.000Z',
        }),
      }),
    );

    await page.route(`**/api/contracts/${contractId}/fund`, (route) => {
      contractStatus = 'active';
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Contract funded successfully',
          escrowAddress: '0x2222222222222222222222222222222222222222',
          contractStatus: 'active',
        }),
      });
    });

    await page.route(`**/api/contracts/${contractId}/fund-info`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          contractId,
          freelancerWallet: '0x3333333333333333333333333333333333333333',
          platformWallet: '0x4444444444444444444444444444444444444444',
          milestoneAmounts: ['2000000000000000000000'],
          milestoneDescriptions: ['Main Deliverable'],
          totalAmount: '2000000000000000000000',
        }),
      }),
    );

    await page.route(`**/api/payments/contracts/${contractId}/status`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          contractId,
          escrowAddress: contractStatus === 'active' ? '0x2222222222222222222222222222222222222222' : '',
          totalAmount: 2000,
          releasedAmount: 0,
          pendingAmount: 2000,
          milestones: [{ id: 'milestone-1', title: 'Main Deliverable', amount: 2000, status: 'pending' }],
          contractStatus,
        }),
      }),
    );

    await page.route(`**/api/milestones/contract/${contractId}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.route(`**/api/transactions/contract/${contractId}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.route(`**/api/contracts/${contractId}/disputes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.route(`**/api/payments/contracts/${contractId}/history`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ contractId, items: [] }) }),
    );

    // 7. Visit Contract Workspace
    await page.goto(`/dashboard/employer/contracts/${contractId}`);
    await expect(page.getByRole('heading', { name: 'Full Stack DApp Marketplace' })).toBeVisible();

    // Verify Pending Status & Funding Button
    const fundButton = page.getByRole('button', { name: /Fund contract securely/i });
    await expect(fundButton).toBeVisible();
    await fundButton.click();

    // Verify Activated Confirmation
    await expect(page.getByText('Contract funded and activated.')).toBeVisible();
    await expect(page.getByText('Active', { exact: true })).toBeVisible();
  });
});
