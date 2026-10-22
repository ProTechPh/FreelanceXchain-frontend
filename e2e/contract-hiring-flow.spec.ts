import { expect, test, type Page } from '@playwright/test';

/**
 * Hiring flow in the contract workspace: negotiate → sign → fund.
 * Hermetic: every API call is stubbed; the backend rules are covered by the API suite.
 */
const contractId = '223e4567-e89b-12d3-a456-426614174000';
const freelancer = {
  id: 'freelancer-1',
  email: 'freelancer@example.com',
  name: 'Fred Freelancer',
  role: 'freelancer',
  walletAddress: '0x3333333333333333333333333333333333333333',
  kycStatus: 'approved',
  createdAt: '2026-08-06T00:00:00.000Z',
  updatedAt: '2026-08-06T00:00:00.000Z',
};
const employer = { ...freelancer, id: 'employer-1', email: 'employer@example.com', name: 'Erin Employer', role: 'employer', walletAddress: '0x1111111111111111111111111111111111111111' };

const inDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

function contract(status: string, extra: Record<string, unknown> = {}) {
  return {
    id: contractId,
    projectId: 'project-1',
    proposalId: 'proposal-1',
    freelancerId: freelancer.id,
    employerId: employer.id,
    escrowAddress: '',
    baseAmount: 2,
    rushFee: 0,
    totalAmount: 2.5,
    additionalPay: 0.5,
    status,
    milestoneSource: 'contract',
    title: 'Escrow dApp',
    createdAt: '2026-08-06T00:00:00.000Z',
    updatedAt: '2026-08-06T00:00:00.000Z',
    ...extra,
  };
}

const offer = {
  id: 'offer-1',
  contractId,
  round: 1,
  proposedBy: employer.id,
  proposerRole: 'employer',
  status: 'pending',
  baseAmount: 2,
  additionalPay: 0.5,
  isRush: false,
  rushFeePercentage: 0,
  rushFee: 0,
  totalAmount: 2.5,
  milestones: [
    { title: 'Design', description: 'Mockups', amount: 1, dueDate: inDays(20) },
    { title: 'Build', description: '', amount: 1.5, dueDate: inDays(40) },
  ],
  deadline: inDays(45),
  message: 'Initial terms based on the project posting and your proposal.',
  parentOfferId: null,
  respondedBy: null,
  respondedAt: null,
  isSeed: true,
  createdAt: '2026-08-06T00:00:00.000Z',
  updatedAt: '2026-08-06T00:00:00.000Z',
};

async function signIn(page: Page, user: typeof freelancer) {
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
  for (const path of ['milestones/contract', 'transactions/contract']) {
    await page.route(`**/api/${path}/${contractId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  }
  await page.route(`**/api/contracts/${contractId}/disputes`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route('**/api/payments/contracts/*/history', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ contractId, items: [] }) }));
  await page.route(`**/api/payments/contracts/${contractId}/status`, (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ contractId, escrowAddress: '', totalAmount: 2.5, releasedAmount: 0, pendingAmount: 2.5, milestones: [], contractStatus: 'negotiating' }),
  }));
}

test('freelancer reviews the seeded offer and accepts the terms', async ({ page }) => {
  await signIn(page, freelancer);
  let status = 'negotiating';
  let acceptCalls = 0;
  await page.route(`**/api/contracts/${contractId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contract(status)) }));
  await page.route(`**/api/contracts/${contractId}/negotiation`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      contract: contract('negotiating'),
      role: 'freelancer',
      floor: { proposedRate: 2, estimatedDuration: 30 },
      template: { projectTitle: 'Escrow dApp', deadline: inDays(60), isRush: false, rushFeePercentage: 0, milestones: [] },
      offers: [offer],
      openOffer: offer,
      acceptedOffer: null,
      permissions: { canPropose: true, canAccept: true, canDecline: true, canWithdraw: false, canEnd: true, canReopen: false },
      limits: { maxMilestones: 20, maxRounds: 30, roundsUsed: 1 },
      chat: { otherPartyId: employer.id, projectId: 'project-1' },
    }),
  }));
  await page.route(`**/api/contracts/${contractId}/offers/offer-1/accept`, (route) => {
    acceptCalls += 1;
    status = 'awaiting_signatures';
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contract('awaiting_signatures')) });
  });
  await page.route(`**/api/contracts/${contractId}/signing-payload`, (route) => route.fulfill({ status: 409, contentType: 'application/json', body: '{}' }));

  await page.goto(`/dashboard/freelancer/contracts/${contractId}`);
  await expect(page.getByText('Negotiate terms', { exact: true })).toBeVisible();
  await expect(page.getByText("freelancer's rate of", { exact: false })).toBeVisible();
  await expect(page.getByText('From the project posting', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Discuss in chat/ })).toHaveAttribute('href', /recipientId=employer-1/);

  await page.getByRole('button', { name: 'Accept terms' }).click();
  await expect(page.getByText('Terms agreed. Next: sign the contract.')).toBeVisible();
  expect(acceptCalls).toBe(1);
});

test('counter-offer builder enforces the floor before sending', async ({ page }) => {
  await signIn(page, freelancer);
  let offerBody: Record<string, unknown> | null = null;
  await page.route(`**/api/contracts/${contractId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contract('negotiating')) }));
  await page.route(`**/api/contracts/${contractId}/negotiation`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      contract: contract('negotiating'),
      role: 'freelancer',
      floor: { proposedRate: 2, estimatedDuration: 30 },
      template: { projectTitle: 'Escrow dApp', deadline: inDays(60), isRush: false, rushFeePercentage: 0, milestones: [] },
      offers: [offer],
      openOffer: offer,
      acceptedOffer: null,
      permissions: { canPropose: true, canAccept: true, canDecline: true, canWithdraw: false, canEnd: true, canReopen: false },
      limits: { maxMilestones: 20, maxRounds: 30, roundsUsed: 1 },
      chat: { otherPartyId: employer.id, projectId: 'project-1' },
    }),
  }));
  await page.route(`**/api/contracts/${contractId}/offers`, async (route) => {
    offerBody = JSON.parse(route.request().postData() ?? '{}');
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ ...offer, id: 'offer-2', round: 2 }) });
  });

  await page.goto(`/dashboard/freelancer/contracts/${contractId}`);
  await page.getByRole('button', { name: 'Counter-offer' }).click();
  const dialog = page.getByRole('dialog');
  // Amounts default to pesos; switch to ETH for exact values.
  await expect(dialog.getByRole('button', { name: '₱ Peso' })).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('button', { name: 'ETH', exact: true }).click();
  // The base may go down to half the proposed rate (2 ETH → 1 ETH), not below.
  await dialog.getByLabel('Base amount').fill('0.9');
  await expect(dialog.getByText("can't go below half of the freelancer's rate", { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Send counter-offer' }).click();
  expect(offerBody).toBeNull();

  await dialog.getByLabel('Base amount').fill('2');
  await dialog.getByLabel('Additional pay').fill('1');
  await dialog.getByRole('switch', { name: 'Rush delivery' }).click();
  await expect(dialog.getByLabel('Rush fee percentage')).toHaveValue('25');
  await dialog.getByRole('switch', { name: 'Rush delivery' }).click();
  await dialog.getByRole('button', { name: 'Auto-balance' }).click();
  await dialog.getByRole('button', { name: 'Send counter-offer' }).click();
  await expect(page.getByText('Offer sent.')).toBeVisible();
  expect(offerBody).toMatchObject({ baseAmount: 2, additionalPay: 1 });
});

test('employer sees the funding step with a countdown after both signed', async ({ page }) => {
  await signIn(page, employer);
  const deadline = new Date(Date.now() + 30 * 3600 * 1000).toISOString();
  await page.route(`**/api/contracts/${contractId}`, (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify(contract('awaiting_funding', { fundingDeadline: deadline, termsHash: `0x${'a'.repeat(64)}` })),
  }));
  await page.route(`**/api/contracts/${contractId}/fund-info`, (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ contractId, freelancerWallet: freelancer.walletAddress, arbiterWallet: '0x5555555555555555555555555555555555555555', platformWallet: '0x4444444444444444444444444444444444444444', milestoneAmounts: ['1000000000000000000', '1500000000000000000'], milestoneDescriptions: ['Design', 'Build'], totalAmount: '2500000000000000000', fundingDeadline: deadline }),
  }));
  const signature = (role: string, id: string) => ({
    id: `sig-${role}`, contractId, signerId: id, signerRole: role, termsHash: `0x${'a'.repeat(64)}`, signatureType: 'typed',
    signatureImage: null, typedName: role === 'employer' ? 'Erin Employer' : 'Fred Freelancer',
    walletAddress: role === 'employer' ? employer.walletAddress : freelancer.walletAddress, walletSignature: `0x${'b'.repeat(130)}`,
    consentVersion: 'fxc-esign-v1', signedAt: '2026-08-07T00:00:00.000Z', status: 'valid',
  });
  await page.route(`**/api/contracts/${contractId}/signing-payload`, (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({
      contractId, status: 'awaiting_funding', termsHash: `0x${'a'.repeat(64)}`, chainId: 1337, chainIdHex: '0x539',
      terms: { schema: 'fxc-contract-terms/v1', contractId, projectId: 'project-1', employerWallet: employer.walletAddress, freelancerWallet: freelancer.walletAddress, currency: 'ETH', baseAmountWei: '2000000000000000000', additionalPayWei: '500000000000000000', rushFeeBps: 0, rushFeeWei: '0', totalAmountWei: '2500000000000000000', deadline: inDays(45), milestones: [], legalTermsVersion: 'fxc-legal-v1', legalTermsHash: `0x${'c'.repeat(64)}` },
      typedData: null,
      legal: { version: 'fxc-legal-v1', hash: `0x${'c'.repeat(64)}`, clauses: [], statement: 'I agree', consentVersion: 'fxc-esign-v1' },
      signatures: [signature('freelancer', freelancer.id), signature('employer', employer.id)],
      nextSigner: null, canSign: false, projectTitle: 'Escrow dApp',
    }),
  }));

  await page.goto(`/dashboard/employer/contracts/${contractId}`);
  await expect(page.getByText('Fund the escrow to start the work', { exact: true })).toBeVisible();
  await expect(page.getByText(/left to fund/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fund escrow now' })).toBeEnabled();
  await expect(page.getByText('Contract signatures', { exact: true })).toBeVisible();
  await expect(page.getByText('Fred Freelancer').first()).toBeVisible();
});

test('peso amounts in the offer builder are converted to ETH', async ({ page }) => {
  await signIn(page, freelancer);
  let offerBody: Record<string, unknown> | null = null;
  await page.route('**/api/crypto/eth-php', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ rate: 155000, source: 'test' }) }));
  await page.route(`**/api/contracts/${contractId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contract('negotiating')) }));
  await page.route(`**/api/contracts/${contractId}/negotiation`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      contract: contract('negotiating'),
      role: 'freelancer',
      floor: { proposedRate: 0.1, estimatedDuration: 30 },
      template: { projectTitle: 'Escrow dApp', deadline: inDays(60), isRush: false, rushFeePercentage: 0, milestones: [] },
      offers: [],
      openOffer: null,
      acceptedOffer: null,
      permissions: { canPropose: true, canAccept: false, canDecline: false, canWithdraw: false, canEnd: true, canReopen: false },
      limits: { maxMilestones: 20, maxRounds: 30, roundsUsed: 0 },
      chat: { otherPartyId: employer.id, projectId: 'project-1' },
    }),
  }));
  await page.route(`**/api/contracts/${contractId}/offers`, async (route) => {
    offerBody = JSON.parse(route.request().postData() ?? '{}');
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ ...offer, id: 'offer-9' }) });
  });

  await page.goto(`/dashboard/freelancer/contracts/${contractId}`);
  await page.getByRole('button', { name: 'Propose terms' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Base amount').fill('23250');
  await expect(dialog.getByText('= ETH 0.1500')).toBeVisible(); // explicit 4-digit conversion hint
  await dialog.getByRole('button', { name: 'Auto-balance' }).click();
  await dialog.getByRole('button', { name: 'Send offer' }).click();
  await expect(page.getByText('Offer sent.')).toBeVisible();
  expect(offerBody).toMatchObject({ baseAmount: 0.15 });
  expect((offerBody as unknown as { milestones: Array<{ amount: number }> }).milestones[0]!.amount).toBe(0.15);
});
