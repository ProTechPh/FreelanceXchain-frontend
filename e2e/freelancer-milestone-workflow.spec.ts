import { expect, test } from './fixtures/authSetup';

const contractId = '123e4567-e89b-12d3-a456-426614174070';
const milestoneId = '123e4567-e89b-12d3-a456-426614174071';

test('freelancer validates and submits milestone deliverables', async ({ page, authenticateAs }) => {
  const freelancer = await authenticateAs('freelancer', { walletAddress: '' });
  let submissionCount = 0;
  let submittedBody = '';
  let milestoneStatus = 'in_progress';

  await page.route('**/auth/csrf-token', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' },
    body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }),
  }));
  await page.route(`**/api/contracts/${contractId}`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      id: contractId,
      projectId: 'project-1',
      proposalId: 'proposal-1',
      freelancerId: freelancer.id,
      employerId: 'employer-1',
      escrowAddress: '',
      baseAmount: 1,
      rushFee: 0,
      totalAmount: 1,
      status: 'active',
      title: 'Analytics dashboard',
      createdAt: freelancer.createdAt,
      updatedAt: freelancer.updatedAt,
    }),
  }));
  await page.route(`**/api/milestones/contract/${contractId}`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{
      id: milestoneId,
      contract_id: contractId,
      title: 'Dashboard delivery',
      description: 'Deliver the completed analytics dashboard.',
      amount: 1,
      due_date: '2026-11-01T00:00:00.000Z',
      status: milestoneStatus,
    }]),
  }));
  await page.route(`**/api/milestones/${milestoneId}/submit-with-files`, async (route) => {
    submissionCount += 1;
    submittedBody = route.request().postData() ?? '';
    milestoneStatus = 'submitted';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: milestoneId, contractId, status: milestoneStatus }),
    });
  });

  for (const endpoint of [
    `**/api/transactions/contract/${contractId}`,
    `**/api/contracts/${contractId}/disputes`,
    `**/api/contracts/${contractId}/rush-upgrade-requests`,
    `**/api/escrow/${contractId}/refunds`,
  ]) {
    await page.route(endpoint, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  }
  await page.route(`**/api/payments/contracts/${contractId}/status`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ contractId, totalAmount: 1, releasedAmount: 0, pendingAmount: 1, milestones: [], contractStatus: 'active' }),
  }));
  await page.route(`**/api/payments/contracts/${contractId}/history`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ contractId, items: [] }),
  }));

  await page.goto(`/dashboard/freelancer/contracts/${contractId}`, { waitUntil: 'domcontentloaded' });
  const submitButton = page.getByRole('button', { name: 'Submit milestone: Dashboard delivery' });
  await expect(submitButton).toBeVisible();

  await submitButton.click();
  await expect(page.getByText('Add at least one deliverable file before submitting this milestone.')).toBeVisible();
  expect(submissionCount).toBe(0);

  await page.getByLabel('Deliverable files').setInputFiles({
    name: 'dashboard-report.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 dashboard report'),
  });
  await page.getByLabel('Submission notes').fill('Completed dashboard and validation report.');
  await submitButton.click();

  await expect(page.getByText('Milestone submitted for review.')).toBeVisible();
  expect(submissionCount).toBe(1);
  expect(submittedBody).toContain('dashboard-report.pdf');
  expect(submittedBody).toContain('Completed dashboard and validation report.');
  await expect(submitButton).toHaveCount(0);
});
