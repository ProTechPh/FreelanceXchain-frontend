import { expect, test, type Page } from '@playwright/test';

const createdAt = '2026-08-06T00:00:00.000Z';
const freelancer = { id: 'freelancer-5', email: 'freelancer@example.com', name: 'Freelancer', role: 'freelancer', walletAddress: '0x1111111111111111111111111111111111111111', kycStatus: 'approved', createdAt, updatedAt: createdAt };

async function setup(page: Page, onAnalytics: (url: URL) => void) {
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('refresh_token', 'app-refresh-token');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: storedUser, isAuthenticated: true }, version: 0 }));
  }, freelancer);
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: freelancer }) }));
  await page.route('**/auth/csrf-token', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' }, body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }) }));

  await page.route(/\/api\/analytics\/freelancer(?:\?.*)?$/, (route) => {
    onAnalytics(new URL(route.request().url()));
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ totalEarnings: 1200, projectsCompleted: 4, averageRating: 4.8, earningsByMonth: [], topSkills: [], proposalAcceptanceRate: 50 }),
    });
  });

  await page.route(/\/api\/contracts(?:\?.*)?$/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], hasMore: false }) }));
  await page.route('**/api/proposals/my-proposals', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route(/\/api\/matching\/projects(?:\?.*)?$/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route(`**/api/reputation/${freelancer.id}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ userId: freelancer.id, averageRating: 4.8, totalRatings: 9 }) }));
}

test('selecting a preset sends startDate and endDate to the analytics endpoint', async ({ page }) => {
  const requests: URL[] = [];
  await setup(page, (url) => requests.push(url));

  await page.goto('/dashboard/freelancer');
  // The default is All time, which deliberately sends no date params so the API
  // returns the lifetime view.
  await expect.poll(() => requests.length).toBeGreaterThan(0);
  expect(requests[0].searchParams.get('startDate')).toBeNull();

  await page.getByRole('radio', { name: 'Last 30 days' }).click();
  await expect.poll(() => requests.some((url) => url.searchParams.get('startDate') !== null)).toBe(true);

  const ranged = requests.find((url) => url.searchParams.get('startDate') !== null)!;
  const start = Date.parse(ranged.searchParams.get('startDate')!);
  const end = Date.parse(ranged.searchParams.get('endDate')!);
  expect((end - start) / 86_400_000).toBe(30);
});

test('re-selecting an already-fetched range serves from cache without a second request', async ({ page }) => {
  const requests: URL[] = [];
  await setup(page, (url) => requests.push(url));

  await page.goto('/dashboard/freelancer');
  await expect.poll(() => requests.length).toBe(1);

  await page.getByRole('radio', { name: 'Last 7 days' }).click();
  await expect.poll(() => requests.length).toBe(2);

  // Back to All time — already cached, and staleTime mirrors the API's 60s TTL,
  // so this must not hit the network again.
  await page.getByRole('radio', { name: 'All time' }).click();
  await expect(page.getByText('Total Earned')).toBeVisible();
  await page.waitForTimeout(500);
  expect(requests.length).toBe(2);
});
