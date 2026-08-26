import { expect, test, type Page } from '@playwright/test';

const contractId = '123e4567-e89b-12d3-a456-426614174090';
const createdAt = '2026-08-06T00:00:00.000Z';

const employer = { id: 'employer-9', email: 'employer@example.com', name: 'Employer', role: 'employer', walletAddress: '0x1111111111111111111111111111111111111111', kycStatus: 'approved', createdAt, updatedAt: createdAt };
const freelancer = { ...employer, id: 'freelancer-9', email: 'freelancer@example.com', name: 'Freelancer', role: 'freelancer' };

const ledger = [
  { id: 'pay-1', milestoneId: null, payerId: employer.id, payeeId: freelancer.id, amount: 2.5, currency: 'ETH', txHash: '0xabc1234567890def', status: 'completed', paymentType: 'escrow_deposit', createdAt: '2026-08-10T00:00:00.000Z' },
  { id: 'pay-2', milestoneId: 'milestone-1', payerId: employer.id, payeeId: freelancer.id, amount: 1, currency: 'ETH', txHash: null, status: 'pending', paymentType: 'milestone_release', createdAt: '2026-08-09T00:00:00.000Z' },
];

async function setup(page: Page, user: typeof employer, items: typeof ledger) {
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('refresh_token', 'app-refresh-token');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: storedUser, isAuthenticated: true }, version: 0 }));
  }, user);
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user }) }));
  await page.route('**/auth/csrf-token', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' }, body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }) }));

  const contract = { id: contractId, projectId: 'project-1', proposalId: 'proposal-1', freelancerId: freelancer.id, employerId: employer.id, escrowAddress: '0x2222222222222222222222222222222222222222', baseAmount: 3.5, rushFee: 0, totalAmount: 3.5, status: 'active', title: 'Ledger contract', milestones: [], createdAt, updatedAt: createdAt };
  await page.route(`**/api/contracts/${contractId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contract) }));
  await page.route(`**/api/milestones/contract/${contractId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route(`**/api/transactions/contract/${contractId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route(`**/api/contracts/${contractId}/disputes`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route(`**/api/payments/contracts/${contractId}/history`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ contractId, items }) }));
}

test('freelancer sees ledger entries as money received', async ({ page }) => {
  await setup(page, freelancer, ledger);
  await page.goto(`/dashboard/freelancer/contracts/${contractId}`);

  await expect(page.getByText('Payment ledger', { exact: true })).toBeVisible();
  await expect(page.getByText('Escrow deposit')).toBeVisible();
  await expect(page.getByText('Milestone release')).toBeVisible();
  // Inbound money is signed positive for the payee.
  await expect(page.getByText(/\+ETH\s*2\.5000/)).toBeVisible();
});

test('employer sees the same entries as money paid out', async ({ page }) => {
  await setup(page, employer, ledger);
  await page.goto(`/dashboard/employer/contracts/${contractId}`);

  await expect(page.getByText('Payment ledger', { exact: true })).toBeVisible();
  await expect(page.getByText(/−ETH\s*2\.5000/)).toBeVisible();
});

test('only completed payments count toward the ledger totals', async ({ page }) => {
  await setup(page, freelancer, ledger);
  await page.goto(`/dashboard/freelancer/contracts/${contractId}`);

  // 2.5 completed + 1 pending: the pending row is listed but must not be counted.
  await expect(page.getByText('Payment ledger', { exact: true })).toBeVisible();
  const received = page.locator('[data-slot="ledger-total"]').filter({ hasText: 'Received' });
  await expect(received).toContainText(/ETH\s*2\.5000/);
});

test('an empty ledger explains what will appear rather than looking broken', async ({ page }) => {
  await setup(page, freelancer, []);
  await page.goto(`/dashboard/freelancer/contracts/${contractId}`);

  await expect(page.getByText('No payments yet')).toBeVisible();
});

test('the ledger is labelled distinctly from the blockchain transaction list', async ({ page }) => {
  await setup(page, freelancer, ledger);
  await page.goto(`/dashboard/freelancer/contracts/${contractId}`);

  await expect(page.getByText('Payment ledger', { exact: true })).toBeVisible();
  await expect(page.getByText('Blockchain transactions', { exact: true })).toBeVisible();
});
