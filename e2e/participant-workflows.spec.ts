import { expect, test, type Page } from '@playwright/test';

const contractId = '123e4567-e89b-12d3-a456-426614174010';
const milestoneId = '123e4567-e89b-12d3-a456-426614174011';
const disputeId = '123e4567-e89b-12d3-a456-426614174012';
const notificationId = '123e4567-e89b-12d3-a456-426614174013';
const user = {
  id: 'employer-1',
  email: 'employer@example.com',
  name: 'Employer',
  role: 'employer',
  walletAddress: '',
  kycStatus: 'approved',
  createdAt: '2026-08-06T00:00:00.000Z',
  updatedAt: '2026-08-06T00:00:00.000Z',
};

async function authenticate(page: Page) {
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('refresh_token', 'app-refresh-token');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: storedUser, isAuthenticated: true }, version: 0 }));
  }, user);
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user }) }));
  await page.route('**/auth/csrf-token', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' },
    body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }),
  }));
}

test('verified employer opens a dispute for a submitted milestone', async ({ page }) => {
  let createBody: unknown;
  await authenticate(page);
  await page.route('**/api/disputes?**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], continuationToken: null }) }));
  await page.route('**/api/contracts?**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ items: [{ id: contractId, projectId: 'project-1', proposalId: 'proposal-1', freelancerId: 'freelancer-1', employerId: user.id, escrowAddress: '0x1', baseAmount: 1000, rushFee: 0, totalAmount: 1000, status: 'active', title: 'Analytics dashboard', milestones: [], createdAt: user.createdAt, updatedAt: user.updatedAt }], hasMore: false, total: 1 }),
  }));
  await page.route(`**/api/milestones/contract/${contractId}`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: milestoneId, contract_id: contractId, title: 'Dashboard delivery', description: 'Deliver dashboard', amount: 1000, due_date: '2026-09-01T00:00:00.000Z', status: 'submitted' }]),
  }));
  await page.route('**/api/disputes', async (route) => {
    createBody = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: disputeId, ...(createBody as object), initiatorId: user.id, evidence: [], status: 'open', resolution: null, createdAt: user.createdAt, updatedAt: user.updatedAt }),
    });
  });

  await page.goto('/dashboard/employer/disputes');
  await page.getByLabel('Active contract').selectOption(contractId);
  await page.getByLabel('Submitted milestone').selectOption(milestoneId);
  await page.getByLabel('Reason').fill('The submitted dashboard is missing required reports.');
  await page.getByRole('button', { name: 'Open dispute' }).click();

  await expect(page.getByText('Dispute opened and milestone funds locked.')).toBeVisible();
  expect(createBody).toEqual({ contractId, milestoneId, reason: 'The submitted dashboard is missing required reports.' });
});

test('employer notification center marks an item as read', async ({ page }) => {
  let markedRead = false;
  await authenticate(page);
  await page.route('**/api/notifications/stream', (route) => route.fulfill({ status: 200, contentType: 'text/event-stream', body: '' }));
  await page.route('**/api/notifications?**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ items: [{ id: notificationId, userId: user.id, type: 'proposal_received', title: 'New proposal', message: 'A freelancer sent a proposal.', data: {}, isRead: false, createdAt: user.createdAt, updatedAt: user.updatedAt }], hasMore: false }),
  }));
  await page.route(`**/api/notifications/${notificationId}/read`, async (route) => {
    markedRead = true;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: notificationId, isRead: true }) });
  });

  await page.goto('/dashboard/employer/notifications');
  await page.getByText('New proposal').click();
  await expect.poll(() => markedRead).toBe(true);
  await expect(page.getByRole('button', { name: /Unread \(0\)/ })).toBeVisible();
});
