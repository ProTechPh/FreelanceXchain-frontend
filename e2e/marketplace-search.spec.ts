import { expect, test } from '@playwright/test';

const projectId = '123e4567-e89b-12d3-a456-426614174001';
const user = {
  id: 'freelancer-1',
  email: 'freelancer@example.com',
  name: 'Freelancer',
  role: 'freelancer',
  walletAddress: '',
  kycStatus: 'approved',
  createdAt: '2026-08-06T00:00:00.000Z',
  updatedAt: '2026-08-06T00:00:00.000Z',
};

test.beforeEach(async ({ page }) => {
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
});

test('project discovery sends backend filters and persists favorites and saved searches', async ({ page }) => {
  let favoriteBody: unknown;
  let savedSearchBody: unknown;
  const project = {
    id: projectId,
    employerId: 'employer-1',
    title: 'React dashboard build',
    description: 'Build an accessible analytics dashboard.',
    requiredSkills: [{ skillId: 'skill-react', skillName: 'React' }],
    budget: 1500,
    deadline: '2026-09-30T00:00:00.000Z',
    isRush: false,
    rushFeePercentage: 0,
    status: 'open',
    milestones: [],
    freelancerLimit: 1,
    tags: [],
    attachments: [],
    createdAt: '2026-08-06T00:00:00.000Z',
    updatedAt: '2026-08-06T00:00:00.000Z',
  };

  await page.route('**/api/search/projects**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ items: [project], metadata: { pageSize: 12, hasMore: false, offset: 0 } }),
  }));
  await page.route('**/api/skills', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      categories: [{ id: 'category-1', name: 'Development', description: '', isActive: true, createdAt: '', updatedAt: '', skills: [{ id: 'skill-react', categoryId: 'category-1', name: 'React', description: '', isActive: true, createdAt: '', updatedAt: '' }] }],
    }),
  }));
  await page.route('**/api/favorites', async (route) => {
    if (route.request().method() === 'POST') {
      favoriteBody = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'favorite-1', userId: user.id, targetType: 'project', targetId: projectId, createdAt: '2026-08-06T00:00:00.000Z' }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('**/api/saved-searches', async (route) => {
    if (route.request().method() === 'POST') {
      savedSearchBody = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'saved-1', userId: user.id, ...(savedSearchBody as object), createdAt: '2026-08-06T00:00:00.000Z', updatedAt: '2026-08-06T00:00:00.000Z' }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: 'React dashboard build' })).toBeVisible();

  await page.getByLabel('Skill').selectOption('skill-react');
  await page.getByLabel('Minimum budget').fill('500');
  const filteredRequest = page.waitForRequest((request) => request.url().includes('/api/search/projects') && request.url().includes('minBudget=500'));
  await page.getByRole('button', { name: 'Apply filters' }).click();
  const requestUrl = new URL((await filteredRequest).url());
  expect(requestUrl.searchParams.get('skills')).toBe('skill-react');
  expect(requestUrl.searchParams.get('minBudget')).toBe('500');

  const favoriteRequest = page.waitForRequest((request) => request.url().endsWith('/api/favorites') && request.method() === 'POST');
  await page.getByRole('button', { name: 'Save project to favorites' }).click();
  await favoriteRequest;
  await expect(page.getByRole('button', { name: 'Remove project from favorites' })).toBeVisible();
  expect(favoriteBody).toEqual({ targetType: 'project', targetId: projectId });

  await page.getByLabel('Search name').fill('React work');
  await page.getByRole('button', { name: 'Save search' }).click();
  await expect(page.getByRole('button', { name: 'React work', exact: true })).toBeVisible();
  expect(savedSearchBody).toEqual({
    name: 'React work',
    searchType: 'project',
    filters: { skills: ['React'], skillIds: ['skill-react'], minBudget: 500 },
    notifyOnNew: true,
  });
});
