import { expect, test, type Page } from '@playwright/test';

const createdAt = '2026-08-06T00:00:00.000Z';

async function authenticate(page: Page, role: 'freelancer' | 'employer' | 'admin') {
  const user = { id: `${role}-1`, email: `${role}@example.com`, name: role, role, walletAddress: '', kycStatus: 'approved', createdAt, updatedAt: createdAt };
  await page.addInitScript((storedUser) => {
    try {
      localStorage.setItem('access_token', 'app-access-token');
      localStorage.setItem('refresh_token', 'app-refresh-token');
      localStorage.setItem('auth-storage', JSON.stringify({ state: { user: storedUser, isAuthenticated: true }, version: 0 }));
    } catch {
      // Ignore initial frame security errors
    }
  }, user);
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user }) }));
  await page.route('**/auth/csrf-token', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' }, body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }) }));
  await page.route('**/api/notifications/unread-count', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }));
  await page.route('**/api/notifications/stream', (route) => route.abort());
  return user;
}

test('existing user signs in with an email one-time code', async ({ page }) => {
  let verifyBody: unknown;
  const user = { id: 'freelancer-1', email: 'dev@example.com', role: 'freelancer', walletAddress: '', kycStatus: 'approved', createdAt };
  await page.route('**/auth/csrf-token', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' }, body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }) }));
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user }) }));
  await page.route('**/api/auth/login/email-otp', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ userId: 'freelancer-1' }) }));
  await page.route('**/api/auth/login/verify-token', async (route) => {
    verifyBody = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user, accessToken: 'passwordless-access', refreshToken: 'passwordless-refresh' }) });
  });

  await page.goto('/passwordless');
  await page.getByLabel('Email').fill('dev@example.com');
  await page.getByRole('button', { name: 'Email code' }).click();
  await page.getByLabel('One-time code').fill('123456');
  await page.getByRole('button', { name: 'Verify and sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard\/freelancer/);
  expect(verifyBody).toEqual({ userId: 'freelancer-1', secret: '123456' });
  expect(await page.evaluate(() => localStorage.getItem('access_token'))).toBe('passwordless-access');
});

test('user can request another account confirmation email', async ({ page }) => {
  let requestBody: unknown;
  await page.route('**/auth/csrf-token', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' }, body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }) }));
  await page.route('**/api/auth/resend-confirmation', async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Confirmation sent' }) });
  });

  await page.goto('/resend-confirmation');
  await page.getByLabel('Email').fill('pending@example.com');
  await page.getByRole('button', { name: 'Send confirmation email' }).click();
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  expect(requestBody).toEqual({ email: 'pending@example.com' });
});

test('freelancer uses backend skill-gap and extraction tools', async ({ page }) => {
  await authenticate(page, 'freelancer');
  await page.route('**/api/matching/skill-gaps', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ currentSkills: ['React'], recommendedSkills: ['TypeScript'], marketDemand: [{ skillName: 'TypeScript', demandLevel: 'high' }], reasoning: 'TypeScript complements your frontend experience.' }) }));
  await page.route('**/api/matching/extract-skills', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ skillId: 'skill-1', skillName: 'React', confidence: 0.96 }]) }));

  await page.goto('/dashboard/freelancer/skill-analysis');
  await expect(page.getByText('TypeScript complements your frontend experience.')).toBeVisible();
  await page.getByLabel('Job description, résumé, or project brief').fill('Build a React application.');
  await page.getByRole('button', { name: 'Extract skills' }).click();
  await expect(page.getByText('React · 96%')).toBeVisible();
});

test('verified employer edits an unlocked project', async ({ page }) => {
  const user = await authenticate(page, 'employer');
  const projectId = '123e4567-e89b-12d3-a456-426614174030';
  let updateBody: unknown;
  const project = { id: projectId, employerId: user.id, title: 'Original project', description: 'Original project description with enough detail.', requiredSkills: [], budget: 1000, deadline: '2026-09-01T00:00:00.000Z', isRush: false, rushFeePercentage: 0, status: 'open', milestones: [], freelancerLimit: 1, tags: [], attachments: [], createdAt, updatedAt: createdAt };
  await page.route(`**/api/projects/${projectId}`, async (route) => {
    if (route.request().method() === 'PATCH') { updateBody = route.request().postDataJSON(); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...project, ...(updateBody as object) }) }); return; }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(project) });
  });

  await page.goto(`/dashboard/employer/projects/${projectId}/edit`);
  await page.getByLabel('Title').fill('Updated project title');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Project updated.')).toBeVisible();
  expect(updateBody).toMatchObject({ title: 'Updated project title', budget: 1000, status: 'open' });
});

test('administrator creates a taxonomy skill', async ({ page }) => {
  await authenticate(page, 'admin');
  const categoryId = '123e4567-e89b-12d3-a456-426614174031';
  let skillBody: unknown;
  let created = false;
  await page.route('**/api/skills', async (route) => {
    if (route.request().method() === 'POST') { skillBody = route.request().postDataJSON(); created = true; await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'skill-new', ...(skillBody as object), isActive: true, createdAt, updatedAt: createdAt }) }); return; }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ categories: [{ id: categoryId, name: 'Development', description: 'Software skills', isActive: true, createdAt, updatedAt: createdAt, skills: created ? [{ id: 'skill-new', categoryId, name: 'TypeScript', description: 'Typed JavaScript', isActive: true, createdAt, updatedAt: createdAt }] : [] }] }) });
  });

  await page.goto('/dashboard/admin/skills');
  await page.locator('#admin-skill-name').fill('TypeScript');
  await page.locator('#admin-skill-description').fill('Typed JavaScript');
  await page.getByRole('button', { name: 'Create skill' }).click();
  await expect(page.getByText('Skill created.')).toBeVisible();
  expect(skillBody).toEqual({ categoryId, name: 'TypeScript', description: 'Typed JavaScript' });
});

test('administrator approves a freelancer skill suggestion', async ({ page }) => {
  await authenticate(page, 'admin');
  const suggestionId = '123e4567-e89b-12d3-a456-426614174032';
  let moderationBody: unknown;
  await page.route('**/api/skills', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ categories: [] }) }));
  await page.route('**/api/skills/suggestions', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: suggestionId, userId: 'freelancer-1', skillName: 'Prompt engineering', skillDescription: 'Designs reliable language-model prompts.', suggestedBy: 'dev@example.com', timesRequested: 3, status: 'pending', createdAt, updatedAt: createdAt }]) }));
  await page.route(`**/api/skills/suggestions/${suggestionId}/status`, async (route) => {
    moderationBody = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: suggestionId, status: 'approved' }) });
  });

  await page.goto('/dashboard/admin/skills');
  await expect(page.getByText('Prompt engineering')).toBeVisible();
  await page.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByText('Suggestion approved.')).toBeVisible();
  expect(moderationBody).toEqual({ status: 'approved' });
});
