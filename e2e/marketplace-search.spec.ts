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
  await page.route('**/api/projects/stats/categories**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ categories: [{ categoryId: 'category-1', categoryName: 'Development', projectCount: 8, totalBudget: 12000 }] }),
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
  await expect(page.getByText('Development')).toBeVisible();
  await expect(page.getByText('8 open projects')).toBeVisible();

  await page.getByLabel('Skill').selectOption('skill-react');
  await page.getByLabel('Minimum budget').fill('500');
  const filteredRequest = page.waitForRequest((request) => request.url().includes('/api/search/projects') && request.url().includes('minBudget=500'));
  await page.getByRole('button', { name: 'Apply filters' }).click();
  const requestUrl = new URL((await filteredRequest).url());
  expect(requestUrl.searchParams.get('skills')).toBe('skill-react');
  expect(requestUrl.searchParams.get('minBudget')).toBe('500');
  await expect(page).toHaveURL(/skills=skill-react.*minBudget=500/);

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

test('freelancer dashboard browse page uses the server search contract', async ({ page }) => {
  let searchCalls = 0;
  await page.route('**/api/search/projects**', async (route) => {
    searchCalls += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], metadata: { pageSize: 12, hasMore: false, offset: 0 } }) });
  });
  await page.route('**/api/projects/stats/categories**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ categories: [] }) }));
  await page.route('**/api/skills', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ categories: [] }) }));
  await page.route('**/api/favorites', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route('**/api/saved-searches', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route('**/api/notifications/unread-count', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }));
  await page.route('**/api/notifications/stream', (route) => route.fulfill({ status: 200, contentType: 'text/event-stream', body: '' }));

  await page.goto('/dashboard/freelancer/projects');

  await expect(page.getByText('No open projects match these filters.')).toBeVisible();
  expect(searchCalls).toBeGreaterThan(0);

  // The dashboard browse page must render the dashboard shell, not the public
  // homepage shell. It previously re-exported `/projects` wholesale, so the
  // marketing navbar, hero and footer rendered inside the dashboard: two navs,
  // two logos, two search fields and a nested <main>.
  await expect(page.getByRole('heading', { level: 1, name: 'Browse projects' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Dashboard' })).toBeVisible();

  await page.getByLabel('Search', { exact: true }).fill('React');
  await page.getByLabel('Minimum budget').fill('500');
  await page.getByLabel('Maximum budget').fill('5000');
  await expect(page.getByText('3 filters selected')).toBeVisible();

  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByLabel('Search', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Minimum budget')).toHaveValue('');
  await expect(page.getByLabel('Maximum budget')).toHaveValue('');

  // Exactly one main landmark and one h1.
  expect(await page.locator('main').count()).toBe(1);
  expect(await page.locator('h1').count()).toBe(1);

  // No marketing chrome.
  expect(await page.locator('footer').count()).toBe(0);
  await expect(page.getByRole('link', { name: 'Recommended for you' })).toBeVisible();
});

test('the public projects page keeps its marketing shell', async ({ page }) => {
  await page.route('**/api/search/projects**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], metadata: { pageSize: 12, hasMore: false, offset: 0 } }) }));
  await page.route('**/api/projects/stats/categories**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ categories: [] }) }));
  await page.route('**/api/skills', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ categories: [] }) }));
  await page.route('**/api/favorites', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route('**/api/saved-searches', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  await page.goto('/projects');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.locator('main').count()).toBe(1);
  expect(await page.locator('h1').count()).toBe(1);
  expect(await page.locator('footer').count()).toBe(1);
  // The dashboard sidebar must never appear on a public route.
  expect(await page.getByRole('navigation', { name: 'Dashboard' }).count()).toBe(0);
});
