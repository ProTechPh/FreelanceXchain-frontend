import { expect, test, type Page } from '@playwright/test';

const user = {
  id: 'freelancer-kyc-1',
  email: 'verified@example.com',
  name: 'Verification User',
  role: 'freelancer',
  walletAddress: '',
  kycStatus: 'rejected',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

async function authenticate(page: Page) {
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
  await page.route('**/api/notifications/unread-count', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ count: 0 }),
  }));
  await page.route('**/api/notifications/stream', (route) => route.fulfill({
    status: 200,
    contentType: 'text/event-stream',
    body: '',
  }));
}

function verification(overrides: Record<string, unknown> = {}) {
  const timestamp = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  return {
    id: 'kyc-current',
    user_id: user.id,
    status: 'rejected',
    didit_session_id: 'session-current',
    didit_session_url: null,
    didit_workflow_id: 'workflow-1',
    decision: 'declined',
    first_name: null,
    last_name: null,
    date_of_birth: null,
    nationality: null,
    document_type: null,
    document_number: null,
    issuing_country: null,
    document_verified: false,
    liveness_passed: null,
    liveness_confidence_score: null,
    face_matched: null,
    face_similarity_score: null,
    ip_address: null,
    ip_country_code: null,
    is_vpn: null,
    is_proxy: null,
    reviewed_by: null,
    reviewed_at: timestamp,
    admin_notes: 'The submitted document was not readable.',
    created_at: timestamp,
    updated_at: timestamp,
    completed_at: timestamp,
    expires_at: null,
    ...overrides,
  };
}

test('shows verification history and enforces the backend retry cooldown', async ({ page }) => {
  const current = verification();
  const approved = verification({
    id: 'kyc-previous',
    status: 'approved',
    decision: 'approved',
    admin_notes: null,
    created_at: '2025-08-01T00:00:00.000Z',
    updated_at: '2025-08-01T00:05:00.000Z',
  });
  await authenticate(page);
  await page.route('**/api/kyc/status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(current) }));
  await page.route('**/api/kyc/history', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([current, approved]) }));

  await page.goto('/dashboard/freelancer/verification');

  await expect(page.getByText('Verification history', { exact: true })).toBeVisible();
  await expect(page.getByText('The submitted document was not readable.').last()).toBeVisible();
  await expect(page.getByText('Approved', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Retry in \d+h/ })).toBeDisabled();
});

test('retries an eligible verification and promotes the new attempt', async ({ page }) => {
  const oldTimestamp = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  const current = verification({ created_at: oldTimestamp, updated_at: oldTimestamp });
  const pending = verification({
    id: 'kyc-new',
    status: 'pending',
    decision: null,
    admin_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
  });
  let initiated = false;
  await authenticate(page);
  await page.route('**/api/kyc/status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(current) }));
  await page.route('**/api/kyc/history', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([current]) }));
  await page.route('**/api/kyc/initiate', async (route) => {
    initiated = true;
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(pending) });
  });

  await page.goto('/dashboard/freelancer/verification');
  await page.getByRole('button', { name: 'Retry Verification' }).click();

  await expect.poll(() => initiated).toBe(true);
  await expect(page.getByText('Pending', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Current', { exact: true })).toBeVisible();
});

test('opens the in-app verification modal when continuing a session with a session url', async ({ page }) => {
  const current = verification({
    status: 'pending',
    didit_session_url: 'https://verify.didit.me/session/test-session-123',
    decision: null,
    admin_notes: null,
  });
  await authenticate(page);
  await page.route('**/api/kyc/status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(current) }));
  await page.route('**/api/kyc/history', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([current]) }));

  await page.goto('/dashboard/freelancer/verification');

  await page.getByRole('button', { name: /Continue verification/i }).first().click();

  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('Identity Verification', { exact: true })).toBeVisible();
  const iframe = page.locator('iframe[title="Identity Verification Session"]');
  await expect(iframe).toBeVisible();
  await expect(iframe).toHaveAttribute('src', 'https://verify.didit.me/session/test-session-123');
  await expect(iframe).toHaveAttribute('allow', 'camera; microphone; fullscreen; autoplay; encrypted-media');
});

