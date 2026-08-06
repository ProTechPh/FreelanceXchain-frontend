import { expect, test, type Page } from '@playwright/test';

const createdAt = '2026-08-06T00:00:00.000Z';
const projectId = '123e4567-e89b-12d3-a456-426614174060';
const proposalId = '123e4567-e89b-12d3-a456-426614174061';
const freelancerId = '123e4567-e89b-12d3-a456-426614174062';

async function authenticate(page: Page, role: 'freelancer' | 'employer') {
  const user = { id: `${role}-1`, email: `${role}@example.com`, name: role, role, walletAddress: '', kycStatus: 'approved', createdAt, updatedAt: createdAt };
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('refresh_token', 'app-refresh-token');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: storedUser, isAuthenticated: true }, version: 0 }));
  }, user);
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user }) }));
  await page.route('**/auth/csrf-token', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' }, body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }) }));
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
