import { expect, test, type Page } from '@playwright/test';

const contractId = '123e4567-e89b-12d3-a456-426614174040';
const createdAt = '2026-08-06T00:00:00.000Z';

async function authenticate(page: Page, role: 'employer' | 'freelancer') {
  const user = { id: `${role}-1`, email: `${role}@example.com`, name: role, role, walletAddress: '0x1111111111111111111111111111111111111111', kycStatus: 'approved', createdAt, updatedAt: createdAt };
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('refresh_token', 'app-refresh-token');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: storedUser, isAuthenticated: true }, version: 0 }));
  }, user);
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user }) }));
  await page.route('**/auth/csrf-token', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' }, body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }) }));
  return user;
}

async function stubSupportingWorkspaceRoutes(page: Page) {
  await page.route(`**/api/milestones/contract/${contractId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route(`**/api/transactions/contract/${contractId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route(`**/api/contracts/${contractId}/disputes`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
}

test('verified employer requests a rush upgrade from the contract workspace', async ({ page }) => {
  const user = await authenticate(page, 'employer');
  await stubSupportingWorkspaceRoutes(page);
  let requestBody: unknown;
  let rushRequests: unknown[] = [];
  const contract = { id: contractId, projectId: 'project-1', proposalId: 'proposal-1', freelancerId: 'freelancer-1', employerId: user.id, escrowAddress: '0x2222222222222222222222222222222222222222', baseAmount: 1000, rushFee: 0, totalAmount: 1000, status: 'active', title: 'Mobile application', createdAt, updatedAt: createdAt };

  await page.route(`**/api/contracts/${contractId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contract) }));
  await page.route(`**/api/contracts/${contractId}/rush-upgrade-requests`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rushRequests) }));
  await page.route(`**/api/contracts/${contractId}/rush-upgrade`, async (route) => {
    requestBody = route.request().postDataJSON();
    rushRequests = [{ id: 'rush-1', contractId, requestedBy: user.id, proposedPercentage: 20, counterPercentage: null, status: 'pending', respondedBy: null, respondedAt: null, createdAt, updatedAt: createdAt }];
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(rushRequests[0]) });
  });
  await page.route(`**/api/escrow/${contractId}/refunds`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  await page.goto(`/dashboard/employer/contracts/${contractId}`);
  await page.getByLabel('Proposed rush fee').fill('20');
  await page.getByRole('button', { name: 'Request rush upgrade' }).click();

  await expect(page.getByText('Rush upgrade requested.')).toBeVisible();
  await expect(page.getByText('Open request: 20%')).toBeVisible();
  expect(requestBody).toEqual({ proposedPercentage: 20 });
});

test('other contract participant approves a pending escrow refund', async ({ page }) => {
  const user = await authenticate(page, 'freelancer');
  await stubSupportingWorkspaceRoutes(page);
  let contractStatus = 'active';
  let approvalCount = 0;
  const refund = { id: 'refund-1', contract_id: contractId, requested_by: 'employer-1', amount: 500, is_partial: true, reason: 'Reduce the remaining scope', status: 'pending', created_at: createdAt, updated_at: createdAt };

  await page.route(`**/api/contracts/${contractId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: contractId, projectId: 'project-1', proposalId: 'proposal-1', freelancerId: user.id, employerId: 'employer-1', escrowAddress: '0x2222222222222222222222222222222222222222', baseAmount: 1000, rushFee: 0, totalAmount: 1000, status: contractStatus, title: 'Mobile application', createdAt, updatedAt: createdAt }) }));
  await page.route(`**/api/contracts/${contractId}/rush-upgrade-requests`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route(`**/api/escrow/${contractId}/refunds`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([refund]) }));
  await page.route(`**/api/escrow/refunds/${refund.id}/approve`, async (route) => {
    approvalCount += 1;
    refund.status = 'approved';
    contractStatus = 'cancelled';
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(refund) });
  });

  await page.goto(`/dashboard/freelancer/contracts/${contractId}`);
  await expect(page.getByText('Reduce the remaining scope')).toBeVisible();
  await page.getByRole('button', { name: 'Approve refund' }).click();

  await expect(page.getByText('Refund approved.')).toBeVisible();
  await expect(page.getByText('approved', { exact: true })).toBeVisible();
  expect(approvalCount).toBe(1);
});
