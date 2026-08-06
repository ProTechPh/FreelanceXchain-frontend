import { expect, test, type Page } from '@playwright/test';

const timestamps = {
  createdAt: '2026-08-06T00:00:00.000Z',
  updatedAt: '2026-08-06T00:00:00.000Z',
};

async function authenticate(page: Page, user: Record<string, unknown>) {
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('refresh_token', 'app-refresh-token');
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { user: storedUser, isAuthenticated: true },
      version: 0,
    }));
  }, user);
  await page.route('**/api/auth/me', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user }),
  }));
  await page.route('**/auth/csrf-token', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' },
    body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }),
  }));
}

test('employer edits the company profile through the supported profile endpoint', async ({ page }) => {
  const user = { id: 'employer-1', email: 'owner@example.com', name: 'Owner', role: 'employer', walletAddress: '', kycStatus: 'approved', ...timestamps };
  const profile = { id: 'profile-1', userId: user.id, name: 'Owner', nationality: 'PH', companyName: 'Acme Labs', description: 'We build reliable digital products.', industry: 'Technology', ...timestamps };
  let updateBody: unknown;
  await authenticate(page, user);
  await page.route('**/api/employers/profile', async (route) => {
    if (route.request().method() === 'PATCH') {
      updateBody = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...profile, ...(updateBody as object) }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) });
  });

  await page.goto('/dashboard/employer/profile');
  await expect(page.getByLabel('Verified name')).toHaveValue('Owner');
  await expect(page.getByLabel('Nationality')).toHaveValue('PH');
  await page.getByLabel('Company name').fill('Acme Studio');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile saved.')).toBeVisible();
  expect(updateBody).toEqual({
    companyName: 'Acme Studio',
    description: profile.description,
    industry: profile.industry,
  });
});

test('freelancer adds a taxonomy skill with years of experience', async ({ page }) => {
  const user = { id: 'freelancer-1', email: 'dev@example.com', name: 'Developer', role: 'freelancer', walletAddress: '', kycStatus: 'approved', ...timestamps };
  const profile = { id: 'profile-2', userId: user.id, name: 'Developer', nationality: 'PH', bio: 'I build accessible web applications.', hourlyRate: 30, skills: [], experience: [], availability: 'available', ...timestamps };
  let skillBody: unknown;
  await authenticate(page, user);
  await page.route('**/api/freelancers/profile', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) }));
  await page.route('**/api/freelancers/profile/skills', async (route) => {
    skillBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...profile, skills: [{ name: 'React', yearsOfExperience: 3 }] }),
    });
  });
  await page.route('**/api/skills', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ categories: [{ id: 'category-1', name: 'Development', description: '', isActive: true, createdAt: '', updatedAt: '', skills: [{ id: 'skill-react', categoryId: 'category-1', name: 'React', description: '', isActive: true, createdAt: '', updatedAt: '' }] }] }),
  }));
  await page.route('**/api/skills/custom', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  await page.goto('/dashboard/freelancer/profile');
  await expect(page.getByLabel('Nationality')).toHaveValue('PH');
  await page.getByLabel('Add skill').selectOption('skill-react');
  await page.locator('#skill-years').fill('3');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText('React · 3y')).toBeVisible();
  expect(skillBody).toEqual({ skills: [{ name: 'React', yearsOfExperience: 3 }] });
});

test('freelancer profile tolerates legacy and nameless skill entries from the API', async ({ page }) => {
  const user = { id: 'freelancer-1', email: 'dev@example.com', name: 'Developer', role: 'freelancer', walletAddress: '', kycStatus: 'approved', ...timestamps };
  const profile = {
    id: 'profile-2',
    userId: user.id,
    name: 'Developer',
    nationality: 'PH',
    bio: 'I build accessible web applications.',
    hourlyRate: 30,
    skills: [
      { skill_name: 'React', years_of_experience: 3 },
      { yearsOfExperience: 8 },
    ],
    experience: [],
    availability: 'available',
    ...timestamps,
  };
  await authenticate(page, user);
  await page.route('**/api/freelancers/profile', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) }));
  await page.route('**/api/skills', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ categories: [{ id: 'category-1', name: 'Development', description: '', isActive: true, createdAt: '', updatedAt: '', skills: [{ id: 'skill-react', categoryId: 'category-1', name: 'React', description: '', isActive: true, createdAt: '', updatedAt: '' }] }] }),
  }));
  await page.route('**/api/skills/custom', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  await page.goto('/dashboard/freelancer/profile');

  await expect(page.getByText('React · 3y')).toBeVisible();
  await expect(page.getByLabel('Add skill')).not.toContainText('React');
  await expect(page.getByText('No skills added yet.')).not.toBeVisible();
});

test('freelancer profile renders legacy experiences with unique React keys', async ({ page }) => {
  const user = { id: 'freelancer-1', email: 'dev@example.com', name: 'Developer', role: 'freelancer', walletAddress: '', kycStatus: 'approved', ...timestamps };
  const profile = {
    id: 'profile-2',
    userId: user.id,
    name: 'Developer',
    nationality: 'PH',
    bio: 'I build accessible web applications.',
    hourlyRate: 30,
    skills: [],
    experience: [
      { id: 'experience-1', title: 'Engineer', company: 'Current Co', description: 'Current contract', startDate: '2024-01-01', endDate: null },
      { id: 'experience-1', title: 'Developer', company: 'Duplicate Co', description: 'Duplicate persisted id', start_date: '2022-01-01', end_date: '2023-12-31' },
      { experience_id: 'experience-3', title: 'Consultant', company: 'Legacy Co', description: 'Legacy identifier', start_date: '2020-01-01', end_date: null },
      { title: 'Intern', company: 'Old Co', description: 'Missing persisted id', startDate: '2019-01-01', endDate: '2019-12-31' },
    ],
    availability: 'available',
    ...timestamps,
  };
  const keyWarnings: string[] = [];
  let removedExperienceId: string | undefined;
  page.on('console', (message) => {
    if (message.text().includes('Each child in a list should have a unique')) {
      keyWarnings.push(message.text());
    }
  });
  await authenticate(page, user);
  await page.route('**/api/freelancers/profile', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) }));
  await page.route('**/api/freelancers/profile/experience/*', (route) => {
    removedExperienceId = decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1) ?? '');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...profile, experience: profile.experience.slice(0, -1) }),
    });
  });
  await page.route('**/api/skills', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ categories: [] }) }));
  await page.route('**/api/skills/custom', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  await page.goto('/dashboard/freelancer/profile');

  await expect(page.getByText('Engineer', { exact: true })).toBeVisible();
  await expect(page.getByText('Developer', { exact: true })).toBeVisible();
  await expect(page.getByText('Consultant', { exact: true })).toBeVisible();
  await expect(page.getByText('Intern', { exact: true })).toBeVisible();
  expect(keyWarnings).toEqual([]);

  await page.getByRole('button', { name: 'Delete Intern' }).click();
  await expect(page.getByText('Experience removed.')).toBeVisible();
  expect(removedExperienceId).toBe('legacy-experience-3');
});

test('freelancer creates a custom skill and suggests it globally', async ({ page }) => {
  const user = { id: 'freelancer-1', email: 'dev@example.com', name: 'Developer', role: 'freelancer', walletAddress: '', kycStatus: 'approved', ...timestamps };
  const profile = { id: 'profile-2', userId: user.id, name: 'Developer', nationality: 'PH', bio: 'I build accessible web applications.', hourlyRate: 30, skills: [], experience: [], availability: 'available', ...timestamps };
  let createBody: unknown;
  let customSkills: unknown[] = [];
  await authenticate(page, user);
  await page.route('**/api/freelancers/profile', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) }));
  await page.route('**/api/skills', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ categories: [] }) }));
  await page.route('**/api/skills/custom', async (route) => {
    if (route.request().method() === 'POST') {
      createBody = route.request().postDataJSON();
      customSkills = [{ id: 'custom-1', userId: user.id, ...(createBody as object), suggestedForGlobal: true, isApproved: false, ...timestamps }];
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(customSkills[0]) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(customSkills) });
  });

  await page.goto('/dashboard/freelancer/profile');
  await page.locator('#custom-skill-name').fill('Prompt engineering');
  await page.locator('#custom-skill-description').fill('Designs and evaluates reliable language-model prompts.');
  await page.locator('#custom-skill-years').fill('2');
  await page.getByLabel('Suggest for the global taxonomy').check();
  await page.getByRole('button', { name: 'Add custom skill' }).click();

  await expect(page.getByText('Custom skill created and suggested to administrators.')).toBeVisible();
  await expect(page.getByText('Prompt engineering', { exact: true })).toBeVisible();
  expect(createBody).toEqual({ name: 'Prompt engineering', description: 'Designs and evaluates reliable language-model prompts.', yearsOfExperience: 2, suggestForGlobal: true });
});
