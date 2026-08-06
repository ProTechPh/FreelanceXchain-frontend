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

  await page.goto('/dashboard/freelancer/profile');
  await page.getByLabel('Add skill').selectOption('skill-react');
  await page.getByLabel('Years').fill('3');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText('React · 3y')).toBeVisible();
  expect(skillBody).toEqual({ skills: [{ name: 'React', yearsOfExperience: 3 }] });
});
