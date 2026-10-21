import { expect, test, type Page } from '@playwright/test';

const createdAt = '2026-08-06T00:00:00.000Z';
const projectId = '123e4567-e89b-12d3-a456-426614174060';
const proposalId = '123e4567-e89b-12d3-a456-426614174061';
const freelancerId = '123e4567-e89b-12d3-a456-426614174062';

async function authenticate(page: Page, role: 'freelancer' | 'employer') {
  // plan: 'pro' — these specs exercise Pro-gated AI features; without it the
  // user resolves to Free and the gates render locks instead.
  const user = { id: `${role}-1`, email: `${role}@example.com`, name: role, role, plan: 'pro', walletAddress: '', kycStatus: 'approved', createdAt, updatedAt: createdAt };
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('refresh_token', 'app-refresh-token');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: storedUser, isAuthenticated: true }, version: 0 }));
  }, user);
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user }) }));
  await page.route('**/auth/csrf-token', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' }, body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }) }));
  // Posting a project needs a complete business profile; these specs exercise the form itself.
  await page.route('**/api/employers/profile/completeness', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ complete: true, missingFields: [], missingDocuments: [] }) }));
  return user;
}

function makeProject(employerId = 'employer-1') {
  return { id: projectId, employerId, title: 'Build a secure analytics platform', description: 'Create an accessible analytics platform with secure data visualizations.', requiredSkills: [{ skillId: 'skill-react', skillName: 'React' }], budget: 2400, deadline: '2026-09-30T00:00:00.000Z', isRush: false, rushFeePercentage: 0, status: 'open', milestones: [], freelancerLimit: 1, tags: [], attachments: [{ filename: 'requirements.pdf', url: 'https://files.example.com/requirements.pdf', size: 2048, mimeType: 'application/pdf' }], createdAt, updatedAt: createdAt };
}

test('freelancer reviews proposal details with employer history', async ({ page }) => {
  await authenticate(page, 'freelancer');
  const project = makeProject();
  const proposal = { id: proposalId, projectId, freelancerId: 'freelancer-1', coverLetter: 'I can deliver this platform.', attachments: [{ filename: 'portfolio.pdf', url: 'https://files.example.com/portfolio.pdf', size: 1024, mimeType: 'application/pdf' }], proposedRate: 2200, estimatedDuration: 21, status: 'pending', createdAt, updatedAt: createdAt };
  await page.route(`**/api/proposals/${proposalId}/with-employer-history`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ proposal, project, employerHistory: { completedProjectsCount: 12, averageRating: 4.8, reviewCount: 9, companyName: 'Northstar Labs', industry: 'Analytics' } }) }));

  await page.goto(`/dashboard/freelancer/proposals/${proposalId}`);
  await expect(page.getByRole('heading', { name: project.title })).toBeVisible();
  await expect(page.getByText('Northstar Labs', { exact: true })).toBeVisible();
  await expect(page.getByText('4.8 (9)')).toBeVisible();
  await expect(page.getByRole('link', { name: /Open/ })).toHaveAttribute('href', 'https://files.example.com/portfolio.pdf');
});

test('employer sees AI-recommended candidates beside project proposals', async ({ page }) => {
  const user = await authenticate(page, 'employer');
  const project = makeProject(user.id);
  await page.route(`**/api/projects/${projectId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(project) }));
  await page.route(`**/api/projects/${projectId}/proposals`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], hasMore: false, total: 0 }) }));
  await page.route(`**/api/matching/freelancers/${projectId}**`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ freelancerId, matchScore: 94, reputationScore: 91, combinedScore: 93, matchedSkills: ['React', 'TypeScript'], reasoning: 'Strong frontend and analytics delivery history.' }]) }));
  await page.route(`**/api/freelancers/${freelancerId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ userId: freelancerId, name: 'Ada Developer', bio: 'Frontend engineer', hourlyRate: 80, availability: 'available', skills: [], experience: [], nationality: 'PH' }) }));

  await page.goto(`/dashboard/employer/projects/${projectId}/proposals`);
  await expect(page.getByText('Recommended talent', { exact: true })).toBeVisible();
  await expect(page.getByText('Ada Developer')).toBeVisible();
  await expect(page.getByText('93% fit')).toBeVisible();
  await expect(page.getByRole('link', { name: 'View profile' })).toHaveAttribute('href', `/freelancers/${freelancerId}`);
});

test('project form adds AI-suggested taxonomy skills and real reference files', async ({ page }) => {
  await authenticate(page, 'employer');
  const reactId = '123e4567-e89b-12d3-a456-426614174063';
  await page.route('**/api/skills', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ categories: [{ id: 'category-1', name: 'Development', description: '', isActive: true, skills: [{ id: reactId, categoryId: 'category-1', name: 'React', description: '', isActive: true }] }] }) }));
  await page.route('**/api/matching/extract-skills', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ skillId: reactId, skillName: 'React', confidence: 0.98 }]) }));

  await page.goto('/dashboard/employer/projects/new');
  await page.getByLabel('Description').fill('Build a React analytics dashboard with accessible visualizations.');
  await page.getByRole('button', { name: 'Suggest from description' }).click();
  await expect(page.getByLabel('Remove React')).toBeVisible();
  await expect(page.getByText('Added 1 suggested skill.')).toBeVisible();
  await page.getByLabel('Reference attachments (optional)').setInputFiles({ name: 'requirements.pdf', mimeType: 'application/pdf', buffer: Buffer.from('reference brief') });
  await expect(page.getByRole('list', { name: 'Selected project attachments' })).toContainText('requirements.pdf');
});

test('project form splits technical and soft skills and narrows them by title', async ({ page }) => {
  await authenticate(page, 'employer');
  const development = Array.from({ length: 10 }, (_, index) => ({ id: `dev-${index}`, categoryId: 'category-1', name: `Dev Skill ${index}`, description: '', isActive: true }));
  const design = [{ id: 'design-figma', categoryId: 'category-2', name: 'Figma', description: '', isActive: true }];
  const soft = [{ id: 'soft-communication', categoryId: 'category-3', name: 'Communication', description: '', isActive: true }];
  await page.route('**/api/skills', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ categories: [
    { id: 'category-1', name: 'Development', description: '', isActive: true, skills: development },
    { id: 'category-2', name: 'Design', description: '', isActive: true, skills: design },
    { id: 'category-3', name: 'Soft Skills', description: '', isActive: true, skills: soft },
  ] }) }));

  await page.goto('/dashboard/employer/projects/new');
  await expect(page.getByText('No technical skills picked yet. Choose from the list below.')).toBeVisible();
  await expect(page.getByText('Add a project title to narrow these skills.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dev Skill 9', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Figma', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Communication', exact: true })).toHaveCount(0);

  // A title that names a catalog skill narrows the technical skills to its category.
  await page.getByLabel('Project Title').fill('Figma landing page redesign');
  await expect(page.getByText('Showing skills for:')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dev Skill 0', exact: true })).toHaveCount(0);
  const figma = page.getByRole('button', { name: 'Figma', exact: true });
  await figma.click();
  await expect(figma).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Remove Figma')).toBeVisible();
  await expect(page.getByRole('tab', { name: /Technical skills/ })).toContainText('1');

  // Clicking a selected skill again removes it.
  await figma.click();
  await expect(page.getByLabel('Remove Figma')).toBeHidden();

  // Removing the detected category shows every technical skill again.
  await page.getByRole('button', { name: 'Stop showing Design skills' }).click();
  await expect(page.getByText('No match for your project title — showing all technical skills.')).toBeVisible();
  await page.getByLabel('Search skills').fill('skill 7');
  await expect(page.getByRole('button', { name: /^Dev Skill/ })).toHaveCount(1);
  await page.getByRole('button', { name: 'Dev Skill 7', exact: true }).click();
  await expect(page.getByLabel('Remove Dev Skill 7')).toBeVisible();

  // Soft skills live on their own tab, and Clear all there leaves technical picks alone.
  await page.getByRole('tab', { name: /Soft skills/ }).click();
  await expect(page.getByRole('button', { name: 'Dev Skill 7', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Communication', exact: true }).click();
  await expect(page.getByRole('tab', { name: /Soft skills/ })).toContainText('1');
  await page.getByRole('button', { name: 'Clear all' }).click();
  await expect(page.getByText('No soft skills picked yet. Choose from the list below.')).toBeVisible();
  await page.getByRole('tab', { name: /Technical skills/ }).click();
  await expect(page.getByLabel('Remove Dev Skill 7')).toBeVisible();

  await page.getByLabel('Search skills').fill('zzz');
  await expect(page.getByText('No skills match')).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).first().click();
  await page.getByRole('button', { name: 'Clear all' }).click();
  await expect(page.getByText('No technical skills picked yet. Choose from the list below.')).toBeVisible();
});

test('freelancer can open the full recommendation list', async ({ page }) => {
  await authenticate(page, 'freelancer');
  const project = makeProject();
  await page.route('**/api/matching/projects**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ projectId, matchScore: 96, matchedSkills: ['React'], missingSkills: ['D3.js'], reasoning: 'Your React experience is a strong match.' }]) }));
  await page.route(`**/api/projects/${projectId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(project) }));

  await page.goto('/dashboard/freelancer/recommendations');
  await expect(page.getByRole('heading', { name: 'Recommended Projects' })).toBeVisible();
  await expect(page.getByText('96% match')).toBeVisible();
  await expect(page.getByText('Your React experience is a strong match.')).toBeVisible();
});

test('freelancer generates tailored AI proposal and submits it', async ({ page }) => {
  await authenticate(page, 'freelancer');
  const project = makeProject();
  await page.route(`**/api/projects/${projectId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(project) }));
  await page.route('**/api/favorites/check**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ isFavorite: false }) }));
  await page.route(`**/api/matching/generate-proposal/${projectId}`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      coverLetter: '### Dear Client\nI have extensive experience building React analytics platforms and DEX interfaces.',
      proposedRate: 2400,
      estimatedDuration: 14,
      proposedMilestones: [
        { title: 'UI Setup', description: 'Components & layout', amount: 1200, durationDays: 7 },
        { title: 'Integration', description: 'Connect data sources', amount: 1200, durationDays: 7 },
      ],
      highlights: ['98% Verified On-Chain Reputation', 'Built DEX in Portfolio', 'Expert in React'],
    }),
  }));
  await page.route('**/api/proposals', (route) => route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: proposalId }) }));

  await page.goto(`/dashboard/freelancer/projects/${projectId}`);
  await expect(page.getByRole('button', { name: 'AI Proposal' })).toBeVisible();

  // Click AI Proposal
  await page.getByRole('button', { name: 'AI Proposal' }).click();
  await expect(page.getByText('AI Proposal Assistant')).toBeVisible();

  // Verify AI generated fields
  await expect(page.getByText('98% Verified On-Chain Reputation')).toBeVisible();
  await expect(page.getByText('I have extensive experience building React analytics platforms')).toBeVisible();
  await expect(page.getByLabel('Proposed rate (ETH)')).toHaveValue('2400');
  await expect(page.getByLabel('Estimated duration (days)')).toHaveValue('14');
  await expect(page.getByText('AI brief · generated from your pitch')).toBeVisible();
  await expect(page.getByText('1 of 5 attached')).toBeVisible();

  // Submit proposal
  await page.getByRole('button', { name: 'Submit proposal' }).click();
  await expect(page.getByText('Proposal submitted.', { exact: true })).toBeVisible();
  // A sent proposal is not a draft: the dialog closes and never asks to discard it.
  await expect(page.getByRole('dialog', { name: 'Submit Proposal' })).toBeHidden();
  await expect(page.getByText('Discard unsaved proposal?')).toHaveCount(0);
});

async function captureProposalSubmission(page: Page) {
  const submitted: { body: string | null } = { body: null };
  await page.route('**/api/proposals', (route) => {
    submitted.body = route.request().postDataBuffer()?.toString('utf8') ?? null;
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: proposalId }) });
  });
  return submitted;
}

function multipartField(body: string, name: string) {
  return body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)`))?.[1];
}

test('an AI draft with fractional terms is rounded so it can be submitted', async ({ page }) => {
  await authenticate(page, 'freelancer');
  await page.route(`**/api/projects/${projectId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeProject()) }));
  await page.route('**/api/favorites/check**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ isFavorite: false }) }));
  await page.route(`**/api/matching/generate-proposal/${projectId}`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ coverLetter: 'I can build this.', proposedRate: 0.12345, estimatedDuration: 10.5, proposedMilestones: [], highlights: [] }),
  }));
  const submitted = await captureProposalSubmission(page);

  await page.goto(`/dashboard/freelancer/projects/${projectId}`);
  await page.getByRole('button', { name: 'AI Proposal' }).click();
  // ETH rates keep up to 4 decimals.
  await expect(page.getByLabel('Proposed rate (ETH)')).toHaveValue('0.1235');
  await expect(page.getByLabel('Estimated duration (days)')).toHaveValue('11');

  await page.getByRole('button', { name: 'Submit proposal' }).click();
  await expect(page.getByText('Proposal submitted.', { exact: true })).toBeVisible();
  expect(multipartField(submitted.body ?? '', 'proposedRate')).toBe('0.1235');
  expect(multipartField(submitted.body ?? '', 'estimatedDuration')).toBe('11');
  expect(submitted.body).toContain('filename="Proposal_');
});

test('freelancer submits a proposal manually without the AI assistant', async ({ page }) => {
  await authenticate(page, 'freelancer');
  await page.route(`**/api/projects/${projectId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeProject()) }));
  await page.route('**/api/favorites/check**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ isFavorite: false }) }));
  const submitted = await captureProposalSubmission(page);

  await page.goto(`/dashboard/freelancer/projects/${projectId}`);
  await page.getByRole('button', { name: 'Submit Proposal' }).click();
  const dialog = page.getByRole('dialog', { name: 'Submit Proposal' });

  await dialog.getByLabel('Proposed rate (ETH)').fill('0.00005');
  await dialog.getByLabel('Estimated duration (days)').fill('20');
  await dialog.getByLabel('Proposal attachments').setInputFiles({ name: 'plan.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 plan') });
  await dialog.getByRole('button', { name: 'Submit proposal' }).click();
  await expect(dialog.getByText('Proposed rate must be at least 0.0001 ETH.')).toBeVisible();
  expect(submitted.body).toBeNull();

  await dialog.getByLabel('Proposed rate (ETH)').fill('0.15');
  await dialog.getByRole('button', { name: 'Submit proposal' }).click();
  await expect(page.getByText('Proposal submitted.', { exact: true })).toBeVisible();
  expect(multipartField(submitted.body ?? '', 'proposedRate')).toBe('0.15');
  expect(multipartField(submitted.body ?? '', 'estimatedDuration')).toBe('20');
  expect(submitted.body).toContain('filename="plan.pdf"');
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Discard unsaved proposal?')).toHaveCount(0);
});

test('freelancer sees field-level validation and NDA gating before submitting', async ({ page }) => {
  await authenticate(page, 'freelancer');
  await page.route(`**/api/projects/${projectId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeProject()) }));
  await page.route('**/api/favorites/check**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ isFavorite: false }) }));
  const submitted = await captureProposalSubmission(page);

  await page.goto(`/dashboard/freelancer/projects/${projectId}`);
  await page.getByRole('button', { name: 'Submit Proposal' }).click();
  const dialog = page.getByRole('dialog', { name: 'Submit Proposal' });
  const rate = dialog.getByLabel('Proposed rate (ETH)');
  const duration = dialog.getByLabel('Estimated duration (days)');
  const submit = dialog.getByRole('button', { name: 'Submit proposal' });

  // Validation runs field by field, so the first blocked field is the rate.
  await submit.click();
  await expect(dialog.getByText('Proposed rate must be greater than 0.')).toBeVisible();
  expect(submitted.body).toBeNull();

  await rate.fill('0.12345');
  await submit.click();
  await expect(dialog.getByText('Use at most 4 decimal places for the ETH rate.')).toBeVisible();
  expect(submitted.body).toBeNull();

  await rate.fill('0.5');
  await submit.click();
  await expect(dialog.getByText('Estimated duration must be at least 1 day.')).toBeVisible();
  expect(submitted.body).toBeNull();

  await duration.fill('1.5');
  await submit.click();
  await expect(dialog.getByText('Estimated duration must be a whole number of days.')).toBeVisible();
  expect(submitted.body).toBeNull();

  await duration.fill('14');
  await submit.click();
  await expect(dialog.getByText('Attach at least one proposal file.')).toBeVisible();
  expect(submitted.body).toBeNull();

  await dialog.getByLabel('Proposal attachments').setInputFiles({
    name: 'delivery-plan.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 delivery plan'),
  });
  await expect(dialog.getByText('1 of 5 attached')).toBeVisible();
  await dialog.getByRole('button', { name: 'Remove delivery-plan.pdf' }).click();
  await expect(dialog.getByText('0 of 5 attached')).toBeVisible();
  expect(submitted.body).toBeNull();

  // Removing the NDA agreement disables submission even when every field is valid.
  await dialog.getByLabel('Proposal attachments').setInputFiles({
    name: 'delivery-plan.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 delivery plan'),
  });
  const nda = dialog.getByRole('checkbox');
  await expect(nda).toBeChecked();
  await nda.uncheck();
  await expect(submit).toBeDisabled();
  expect(submitted.body).toBeNull();

  await nda.check();
  await expect(submit).toBeEnabled();
  expect(submitted.body).toBeNull();
});
