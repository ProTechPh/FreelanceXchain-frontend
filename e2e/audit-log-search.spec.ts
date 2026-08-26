import { expect, test, type Page } from '@playwright/test';

const createdAt = '2026-08-06T00:00:00.000Z';
const admin = { id: 'admin-1', email: 'admin@example.com', name: 'Admin', role: 'admin', walletAddress: '0x1111111111111111111111111111111111111111', kycStatus: 'approved', createdAt, updatedAt: createdAt };

const entry = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  user_id: 'user-1',
  actor_id: admin.id,
  action: 'user.suspend',
  resource_type: 'user',
  resource_id: 'user-1',
  payload: {},
  ip_address: '127.0.0.1',
  user_agent: 'browser',
  status: 'success',
  error_message: null,
  created_at: createdAt,
  ...overrides,
});

async function setup(page: Page) {
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('refresh_token', 'app-refresh-token');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: storedUser, isAuthenticated: true }, version: 0 }));
  }, admin);
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: admin }) }));
  await page.route('**/auth/csrf-token', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' }, body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }) }));
  await page.route(/\/api\/audit-logs\/summary\/admin-activity(?:\?.*)?$/, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ items: [{ actor_id: admin.id, date: '2026-08-25', actions: { 'user.suspend': 3 }, total: 3 }], totalActions: 3, activeAdmins: 1 }),
  }));
}

test('sends filters to the server rather than filtering in the browser', async ({ page }) => {
  const observed: string[] = [];
  await setup(page);
  await page.route(/\/api\/audit-logs\/search(?:\?.*)?$/, (route) => {
    const url = new URL(route.request().url());
    observed.push(`${url.searchParams.get('action') ?? ''}|${url.searchParams.get('status') ?? ''}`);
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [entry('log-1')], total: 1, hasMore: false, nextCursor: null }) });
  });

  await page.goto('/dashboard/admin/audit-logs');
  await expect(page.getByRole('heading', { name: 'Audit logs' })).toBeVisible();

  await page.getByLabel('Filter by action').fill('user.suspend');
  await page.getByRole('button', { name: 'Failed' }).click();

  await expect.poll(() => observed).toContain('user.suspend|failure');
});

test('an empty filter box sends no param at all', async ({ page }) => {
  const observed: Array<string | null> = [];
  await setup(page);
  await page.route(/\/api\/audit-logs\/search(?:\?.*)?$/, (route) => {
    observed.push(new URL(route.request().url()).searchParams.get('action'));
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, hasMore: false, nextCursor: null }) });
  });

  await page.goto('/dashboard/admin/audit-logs');
  await expect(page.getByText('No audit entries match your filters')).toBeVisible();
  expect(observed.every((value) => value === null)).toBe(true);
});

test('nextCursor drives the following page and rows accumulate', async ({ page }) => {
  const cursors: Array<string | null> = [];
  await setup(page);
  await page.route(/\/api\/audit-logs\/search(?:\?.*)?$/, (route) => {
    const cursor = new URL(route.request().url()).searchParams.get('cursor');
    cursors.push(cursor);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: cursor
        ? JSON.stringify({ items: [entry('log-2', { action: 'user.verify' })], total: 2, hasMore: false, nextCursor: null })
        : JSON.stringify({ items: [entry('log-1')], total: 2, hasMore: true, nextCursor: 'log-1' }),
    });
  });

  await page.goto('/dashboard/admin/audit-logs');
  await expect(page.getByText('user.suspend').first()).toBeVisible();

  await page.getByRole('button', { name: 'Load more' }).click();
  await expect(page.getByText('user.verify')).toBeVisible();
  // The first page stays on screen — pages accumulate rather than replace.
  await expect(page.getByText('user.suspend').first()).toBeVisible();
  await expect.poll(() => cursors).toContain('log-1');
});

test('renders the per-admin activity summary for the selected range', async ({ page }) => {
  await setup(page);
  await page.route(/\/api\/audit-logs\/search(?:\?.*)?$/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, hasMore: false, nextCursor: null }) }));

  await page.goto('/dashboard/admin/audit-logs');
  await expect(page.getByText('Admin activity', { exact: true })).toBeVisible();
  await expect(page.getByText('3 actions by 1 admin in this range.')).toBeVisible();
  await expect(page.getByText('user.suspend (3)')).toBeVisible();
});
