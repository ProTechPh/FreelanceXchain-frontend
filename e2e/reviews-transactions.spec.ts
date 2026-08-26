import { expect, test, type Page } from '@playwright/test';

const contractId = '123e4567-e89b-12d3-a456-426614174020';
const transactionId = '123e4567-e89b-12d3-a456-426614174021';
const user = {
  id: 'employer-1',
  email: 'employer@example.com',
  name: 'Employer',
  role: 'employer',
  walletAddress: '0x1111111111111111111111111111111111111111',
  kycStatus: 'approved',
  createdAt: '2026-08-06T00:00:00.000Z',
  updatedAt: '2026-08-06T00:00:00.000Z',
};

async function authenticate(page: Page, storedUser = user) {
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('refresh_token', 'app-refresh-token');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: storedUser, isAuthenticated: true }, version: 0 }));
  }, storedUser);
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: storedUser }) }));
  await page.route('**/auth/csrf-token', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' },
    body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }),
  }));
  // The transactions and earnings pages now also render the payment ledger and
  // lifetime totals; stub both so these specs stay hermetic.
  await page.route('**/api/payments/summary', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ totalEarnings: 0, totalSpent: 0, available: true }) }));
  await page.route(/\/api\/payments\/me(?:\?.*)?$/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, hasMore: false, totalEarnings: 0, totalSpent: 0 }) }));
}

test('employer reviews the freelancer after a completed contract', async ({ page }) => {
  let reviewBody: unknown;
  await authenticate(page);
  await page.route(`**/api/contracts/${contractId}`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ id: contractId, projectId: 'project-1', proposalId: 'proposal-1', freelancerId: 'freelancer-1', employerId: user.id, escrowAddress: '0x2', baseAmount: 1000, rushFee: 0, totalAmount: 1000, status: 'completed', title: 'Completed dashboard', milestones: [], createdAt: user.createdAt, updatedAt: user.updatedAt }),
  }));
  await page.route(`**/api/milestones/contract/${contractId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route(`**/api/transactions/contract/${contractId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route(`**/api/contracts/${contractId}/disputes`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route(`**/api/reviews/can-review/${contractId}**`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ canRate: true }) }));
  // The workspace now also loads the payment ledger; stub it so the spec stays hermetic.
  await page.route(`**/api/payments/contracts/${contractId}/history`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ contractId, items: [] }) }));
  await page.route('**/api/reviews', async (route) => {
    reviewBody = route.request().postDataJSON();
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'review-1', ...(reviewBody as object), reviewerId: user.id, revieweeId: 'freelancer-1', createdAt: user.createdAt, updatedAt: user.updatedAt }) });
  });

  await page.goto(`/dashboard/employer/contracts/${contractId}`);
  await page.getByLabel('Comment').fill('Excellent delivery and clear communication.');
  await page.getByRole('button', { name: 'Submit review' }).click();
  await expect(page.getByText('Review submitted.')).toBeVisible();
  expect(reviewBody).toEqual({
    rating: 5,
    comment: 'Excellent delivery and clear communication.',
    workQuality: 5,
    communication: 5,
    professionalism: 5,
    wouldWorkAgain: true,
    contractId,
  });
});

test('employer opens an authorized transaction detail from payment history', async ({ page }) => {
  const transaction = {
    id: transactionId,
    contract_id: contractId,
    milestone_id: 'milestone-1',
    from_user_id: user.id,
    to_user_id: 'freelancer-1',
    amount: 1000,
    type: 'escrow_release',
    status: 'completed',
    transaction_hash: '0xabcdef1234567890',
    metadata: JSON.stringify({ network: 'sepolia' }),
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
  await authenticate(page);
  await page.route(/\/api\/transactions(?:\?.*)?$/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [transaction], hasMore: false, total: 1 }) }));
  await page.route(`**/api/transactions/${transactionId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(transaction) }));

  await page.goto('/dashboard/employer/transactions');
  await page.getByRole('link', { name: /Milestone release/ }).click();
  await expect(page.getByRole('heading', { name: 'Transaction detail' })).toBeVisible();
  await expect(page.getByText('0xabcdef1234567890')).toBeVisible();
  await expect(page.getByText('sepolia')).toBeVisible();
});

test('freelancer applies and clears earnings transaction filters', async ({ page }) => {
  const freelancer = { ...user, id: 'freelancer-1', role: 'freelancer' };
  const observedFilters: string[] = [];

  await authenticate(page, freelancer);
  await page.route(/\/api\/transactions(?:\?.*)?$/, (route) => {
    const url = new URL(route.request().url());
    observedFilters.push(`${url.searchParams.get('type') ?? ''}|${url.searchParams.get('status') ?? ''}`);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], hasMore: false, total: 0 }),
    });
  });

  await page.goto('/dashboard/freelancer/earnings');
  await page.getByLabel('Type').selectOption('escrow_release');
  await page.getByLabel('Status').selectOption('completed');

  await expect(page.getByText('2 filters selected')).toBeVisible();
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect.poll(() => observedFilters).toContain('escrow_release|completed');

  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByLabel('Type')).toHaveValue('');
  await expect(page.getByLabel('Status')).toHaveValue('');
  await expect.poll(() => observedFilters.at(-1)).toBe('|');
});
