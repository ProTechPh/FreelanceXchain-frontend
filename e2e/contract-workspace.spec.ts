import { expect, test } from '@playwright/test';

const contractId = '123e4567-e89b-12d3-a456-426614174000';
const user = {
  id: 'user-1',
  email: 'employer@example.com',
  name: 'Employer',
  role: 'employer',
  walletAddress: '0x1111111111111111111111111111111111111111',
  kycStatus: 'approved',
  createdAt: '2026-08-06T00:00:00.000Z',
  updatedAt: '2026-08-06T00:00:00.000Z',
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('refresh_token', 'app-refresh-token');
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { user: storedUser, isAuthenticated: true },
      version: 0,
    }));
    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      value: {
        request: () => {
          const browserWindow = window as Window & { __ethereumCalls?: number };
          browserWindow.__ethereumCalls = (browserWindow.__ethereumCalls ?? 0) + 1;
          throw new Error('Contract funding must not invoke the browser wallet directly.');
        },
      },
    });
  }, user);

  await page.route('**/api/auth/me', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user }),
  }));
  await page.route('**/auth/csrf-token', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' },
    body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }),
  }));
});

test('employer funds a pending contract through the backend escrow endpoint', async ({ page }) => {
  let status = 'pending';
  let fundingRequests = 0;
  let fundingBody: string | null = 'not-called';

  await page.route(`**/api/contracts/${contractId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: contractId,
        projectId: 'project-1',
        proposalId: 'proposal-1',
        freelancerId: 'freelancer-1',
        employerId: user.id,
        escrowAddress: status === 'active' ? '0x2222222222222222222222222222222222222222' : '',
        baseAmount: 900,
        rushFee: 100,
        totalAmount: 1000,
        status,
        title: 'Production landing page',
        createdAt: '2026-08-06T00:00:00.000Z',
        updatedAt: '2026-08-06T00:00:00.000Z',
      }),
    });
  });
  await page.route(`**/api/contracts/${contractId}/fund`, async (route) => {
    fundingRequests += 1;
    fundingBody = route.request().postData();
    status = 'active';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Contract funded successfully',
        escrowAddress: '0x2222222222222222222222222222222222222222',
        contractStatus: 'active',
      }),
    });
  });
  await page.route(`**/api/contracts/${contractId}/fund-info`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ contractId, freelancerWallet: '0x3333333333333333333333333333333333333333', platformWallet: '0x4444444444444444444444444444444444444444', milestoneAmounts: ['1000000000000000000000'], milestoneDescriptions: ['Launch'], totalAmount: '1000000000000000000000' }),
  }));
  await page.route(`**/api/payments/contracts/${contractId}/status`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ contractId, escrowAddress: status === 'active' ? '0x2222222222222222222222222222222222222222' : '', totalAmount: 1000, releasedAmount: 250, pendingAmount: 750, milestones: [{ id: 'milestone-1', title: 'Launch', amount: 1000, status: 'in_progress' }], contractStatus: status }),
  }));
  await page.route(`**/api/milestones/contract/${contractId}`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }));
  await page.route(`**/api/transactions/contract/${contractId}`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }));
  await page.route(`**/api/contracts/${contractId}/disputes`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }));

  await page.goto(`/dashboard/employer/contracts/${contractId}`);
  await expect(page.getByRole('heading', { name: 'Production landing page' })).toBeVisible();
  await expect(page.getByText('$250')).toBeVisible();
  await expect(page.getByText('25%')).toBeVisible();
  await expect(page.getByText('0x3333333333333333333333333333333333333333')).toBeVisible();
  await page.getByRole('button', { name: 'Fund contract securely' }).click();

  await expect(page.getByText('Contract funded and activated.')).toBeVisible();
  await expect(page.getByText('Active', { exact: true })).toBeVisible();
  expect(fundingRequests).toBe(1);
  expect(fundingBody).toBeNull();
  expect(await page.evaluate(() => (window as Window & { __ethereumCalls?: number }).__ethereumCalls ?? 0)).toBe(0);
});
