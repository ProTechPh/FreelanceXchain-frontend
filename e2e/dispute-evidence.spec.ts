import { expect, test, type Page } from '@playwright/test';

const createdAt = '2026-08-06T00:00:00.000Z';
const disputeId = '123e4567-e89b-12d3-a456-426614174080';
const contractId = '123e4567-e89b-12d3-a456-426614174081';
const evidenceId = '123e4567-e89b-12d3-a456-426614174082';

async function authenticate(page: Page, role: 'employer' | 'admin') {
  const user = { id: `${role}-1`, email: `${role}@example.com`, name: role, role, walletAddress: '', kycStatus: 'approved', createdAt, updatedAt: createdAt };
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: storedUser, isAuthenticated: true }, version: 0 }));
  }, user);
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user }) }));
  await page.route('**/auth/csrf-token', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' }, body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }) }));
  return user;
}

function makeDispute(initiatorId: string) {
  return { id: disputeId, contractId, milestoneId: 'milestone-1', initiatorId, reason: 'The delivery is missing required reports.', evidence: [{ id: evidenceId, submitterId: initiatorId, type: 'link', content: 'https://files.example.com/report', submittedAt: createdAt }], status: 'open', resolution: null, createdAt, updatedAt: createdAt };
}

function makeContract(employerId: string) {
  return { id: contractId, projectId: 'project-1', proposalId: 'proposal-1', freelancerId: 'freelancer-1', employerId, escrowAddress: '0x1', baseAmount: 1000, rushFee: 0, totalAmount: 1000, status: 'active', title: 'Analytics platform', milestones: [], createdAt, updatedAt: createdAt };
}

test('participant deletes their own unverified evidence', async ({ page }) => {
  const user = await authenticate(page, 'employer');
  const dispute = makeDispute(user.id);
  await page.route('**/api/disputes?**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [dispute], continuationToken: null }) }));
  await page.route('**/api/contracts?**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [makeContract(user.id)], hasMore: false, total: 1 }) }));
  await page.route(`**/api/disputes/${disputeId}/evidence`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: evidenceId, disputeId, submittedBy: user.id, evidenceType: 'link', fileUrl: 'https://files.example.com/report', description: 'Supporting report', createdAt, updatedAt: createdAt }]) }));
  let deleted = false;
  await page.route(`**/api/disputes/${disputeId}/evidence/${evidenceId}`, async (route) => { deleted = true; await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Evidence deleted successfully' }) }); });
  page.on('dialog', (dialog) => void dialog.accept());

  await page.goto('/dashboard/employer/disputes');
  await expect(page.getByRole('link', { name: 'Open evidence' })).toHaveAttribute('href', 'https://files.example.com/report');
  await page.getByRole('button', { name: 'Delete link evidence' }).click();
  await expect(page.getByText('Evidence deleted.')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Submitted evidence' })).toBeHidden();
  expect(deleted).toBe(true);
});

test('participant opens a dispute detail route backed by the current detail endpoint', async ({ page }) => {
  const user = await authenticate(page, 'employer');
  const dispute = makeDispute(user.id);
  let detailCalls = 0;
  await page.route(`**/api/disputes/${disputeId}`, async (route) => {
    detailCalls += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(dispute) });
  });
  await page.route('**/api/contracts?**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [makeContract(user.id)], hasMore: false, total: 1 }) }));
  await page.route(`**/api/disputes/${disputeId}/evidence`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }));

  await page.goto(`/dashboard/employer/disputes/${disputeId}`);

  await expect(page.getByRole('heading', { name: 'Dispute details' })).toBeVisible();
  await expect(page.getByText('The delivery is missing required reports.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to disputes' })).toHaveAttribute('href', '/dashboard/employer/disputes');
  expect(detailCalls).toBeGreaterThan(0);
});

test('administrator verifies dispute evidence before resolution', async ({ page }) => {
  await authenticate(page, 'admin');
  const dispute = makeDispute('employer-1');
  await page.route('**/api/admin/disputes', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ disputes: [dispute], total: 1, pendingCount: 1, resolvedCount: 0 }) }));
  await page.route(`**/api/contracts/${contractId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeContract('employer-1')) }));
  let verifyCalls = 0;
  await page.route(`**/api/disputes/${disputeId}/evidence/${evidenceId}/verify`, async (route) => { verifyCalls += 1; await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: evidenceId, disputeId, submittedBy: 'employer-1', evidenceType: 'link', fileUrl: 'https://files.example.com/report', description: 'Supporting report', verifiedBy: 'admin-1', verifiedAt: createdAt, createdAt, updatedAt: createdAt }) }); });

  await page.goto('/dashboard/admin/disputes');
  await page.getByRole('button', { name: 'Verify evidence' }).click();
  await expect(page.getByText('Evidence verified.')).toBeVisible();
  await expect(page.getByText('Verified', { exact: true })).toBeVisible();
  expect(verifyCalls).toBe(1);
});
