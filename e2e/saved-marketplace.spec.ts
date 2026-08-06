import { expect, test } from '@playwright/test';

const createdAt = '2026-08-06T00:00:00.000Z';
const user = { id: 'employer-1', email: 'employer@example.com', name: 'Employer', role: 'employer', walletAddress: '', kycStatus: 'approved', createdAt, updatedAt: createdAt };
const searchId = '123e4567-e89b-12d3-a456-426614174050';
const favoriteId = '123e4567-e89b-12d3-a456-426614174051';
const freelancerId = '123e4567-e89b-12d3-a456-426614174052';

test.beforeEach(async ({ page }) => {
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('refresh_token', 'app-refresh-token');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: storedUser, isAuthenticated: true }, version: 0 }));
  }, user);
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user }) }));
  await page.route('**/auth/csrf-token', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' }, body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }) }));
});

test('participant updates and executes a saved search and removes a favorite', async ({ page }) => {
  const savedSearch = { id: searchId, userId: user.id, name: 'React talent', searchType: 'freelancer', filters: { keyword: 'react' }, notifyOnNew: true, createdAt, updatedAt: createdAt };
  let updateBody: unknown;
  let executionCount = 0;
  let favoriteDeleteCount = 0;
  await page.route('**/api/favorites', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: favoriteId, userId: user.id, targetType: 'freelancer', targetId: freelancerId, createdAt, target: { userId: freelancerId, name: 'Ada Developer' } }]) }));
  await page.route(`**/api/favorites/freelancer/${freelancerId}`, async (route) => { favoriteDeleteCount += 1; await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Favorite removed' }) }); });
  await page.route('**/api/saved-searches', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([savedSearch]) }));
  await page.route(`**/api/saved-searches/${searchId}`, async (route) => {
    updateBody = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...savedSearch, ...(updateBody as object) }) });
  });
  await page.route(`**/api/saved-searches/${searchId}/execute`, async (route) => { executionCount += 1; await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [{ userId: freelancerId }], count: 3 }) }); });

  await page.goto('/dashboard/employer/saved');
  await expect(page.getByText('Ada Developer')).toBeVisible();
  await page.getByLabel('Name for React talent').fill('React specialists');
  await page.getByLabel('Notify me about new matches').uncheck();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Saved search updated.')).toBeVisible();
  expect(updateBody).toEqual({ name: 'React specialists', notifyOnNew: false });

  await page.getByRole('button', { name: 'Run search' }).click();
  await expect(page.getByText('Latest run: 3 matches.')).toBeVisible();
  expect(executionCount).toBe(1);

  await page.getByRole('button', { name: 'Remove Ada Developer from favorites' }).click();
  await expect(page.getByText('Favorite removed.')).toBeVisible();
  expect(favoriteDeleteCount).toBe(1);
});
