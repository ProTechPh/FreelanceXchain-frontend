import { expect, test, type Page } from '@playwright/test';

const createdAt = '2026-08-06T00:00:00.000Z';
const freelancerId = '123e4567-e89b-12d3-a456-426614174090';

async function authenticate(page: Page, role: 'employer' | 'admin') {
  const user = { id: `${role}-1`, email: `${role}@example.com`, name: role, role, walletAddress: '', kycStatus: 'approved', createdAt, updatedAt: createdAt };
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: storedUser, isAuthenticated: true }, version: 0 }));
  }, user);
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user }) }));
  await page.route('**/auth/csrf-token', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' }, body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }) }));
  await page.route('**/api/notifications/unread-count', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }));
  await page.route('**/api/notifications/stream', (route) => route.fulfill({ status: 200, contentType: 'text/event-stream', body: '' }));
  return user;
}

test('messages loading state preserves the two-pane workspace', async ({ page }) => {
  await authenticate(page, 'employer');
  let releaseConversations: (() => void) | undefined;
  const conversationsPending = new Promise<void>((resolve) => {
    releaseConversations = resolve;
  });

  await page.route('**/api/messages/conversations', async (route) => {
    await conversationsPending;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], total: 0, hasMore: false }),
    });
  });
  await page.route('**/api/contracts?**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ items: [], hasMore: false, total: 0 }),
  }));

  await page.goto('/dashboard/employer/messages');

  const loadingWorkspace = page.locator('[data-slot="messages-workspace-skeleton"][role="status"]');
  await expect(loadingWorkspace).toBeVisible();
  await expect(loadingWorkspace.getByText('Loading messages')).toBeAttached();
  await expect(loadingWorkspace).toHaveAttribute('aria-busy', 'true');
  await expect(loadingWorkspace.locator('[data-slot="conversation-list-skeleton"]')).toBeVisible();
  await expect(loadingWorkspace.locator('[data-slot="chat-pane-skeleton"]')).toBeVisible();
  await expect.poll(async () => (await loadingWorkspace.boundingBox())?.height ?? 0).toBeGreaterThan(500);

  releaseConversations?.();
});

test('employer uploads a file before sending message attachment metadata', async ({ page }) => {
  const user = await authenticate(page, 'employer');
  await page.route('**/api/messages/conversations', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, hasMore: false }) }));
  await page.route('**/api/contracts?**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [{ id: 'contract-1', employerId: user.id, freelancerId, status: 'active' }], hasMore: false, total: 1 }) }));
  await page.route(`**/api/freelancers/${freelancerId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ userId: freelancerId, name: 'Ada Developer', bio: '', hourlyRate: 80, availability: 'available', skills: [], experience: [] }) }));
  let uploadCalls = 0;
  await page.route('**/api/files/upload', async (route) => { uploadCalls += 1; expect(route.request().postData()).toContain('contract-documents'); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, url: 'https://files.example.com/brief.pdf', path: `${user.id}/messages/brief.pdf` }) }); });
  let sendBody: Record<string, unknown> | undefined;
  const sentMessage = { id: 'message-1', conversation_id: 'conversation-1', sender_id: user.id, receiver_id: freelancerId, content: 'Please review the brief.', is_read: false, attachments: [{ url: 'https://files.example.com/brief.pdf', filename: 'brief.pdf', size: 15, mimeType: 'application/pdf' }], created_at: createdAt, updated_at: createdAt };
  await page.route('**/api/messages/send', async (route) => { sendBody = route.request().postDataJSON(); await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(sentMessage) }); });
  await page.route('**/api/messages/conversations/conversation-1', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, hasMore: false }) }));
  await page.route('**/api/messages/conversations/conversation-1/read', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'read' }) }));

  await page.goto(`/dashboard/employer/messages?recipientId=${freelancerId}`);
  await expect(page.getByText('Ada Developer').last()).toBeVisible();
  await page.getByLabel('Attach files').setInputFiles({ name: 'brief.pdf', mimeType: 'application/pdf', buffer: Buffer.from('project brief!!') });
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Please review the brief.');
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.getByRole('link', { name: /brief.pdf/ })).toHaveAttribute('href', 'https://files.example.com/brief.pdf');
  expect(uploadCalls).toBe(1);
  expect(sendBody).toEqual({ receiverId: freelancerId, content: 'Please review the brief.', attachments: sentMessage.attachments });
});

test('the icon-only send button replaces its icon with one loading spinner', async ({ page }) => {
  const user = await authenticate(page, 'employer');
  await page.route('**/api/messages/conversations', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, hasMore: false }) }));
  await page.route('**/api/contracts?**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [{ id: 'contract-1', employerId: user.id, freelancerId, status: 'active' }], hasMore: false, total: 1 }) }));
  await page.route(`**/api/freelancers/${freelancerId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ userId: freelancerId, name: 'Ada Developer', bio: '', hourlyRate: 80, availability: 'available', skills: [], experience: [] }) }));
  await page.route('**/api/messages/send', async () => {
    await new Promise(() => {});
  });

  await page.goto(`/dashboard/employer/messages?recipientId=${freelancerId}`);
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Please review this.');

  const sendButton = page.getByRole('button', { name: 'Send message' });
  await sendButton.click();

  await expect(sendButton).toHaveAttribute('aria-busy', 'true');
  await expect(sendButton.locator('svg')).toHaveCount(1);
  await expect(sendButton.locator('svg.animate-spin')).toHaveCount(1);
});

test('administrator notification links a dispute to the moderation queue', async ({ page }) => {
  const user = await authenticate(page, 'admin');
  const notificationId = '123e4567-e89b-12d3-a456-426614174091';
  await page.route('**/api/notifications?**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [{ id: notificationId, userId: user.id, type: 'dispute_evidence_submitted', title: 'New evidence', message: 'Evidence needs review.', data: { disputeId: 'dispute-1' }, isRead: false, createdAt, updatedAt: createdAt }], hasMore: false }) }));
  let markedRead = false;
  await page.route(`**/api/notifications/${notificationId}/read`, async (route) => { markedRead = true; await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: notificationId, isRead: true }) }); });

  await page.goto('/dashboard/admin/notifications');
  const notificationLink = page.getByRole('link', { name: /New evidence/ });
  await expect(notificationLink).toHaveAttribute('href', '/dashboard/admin/disputes');
  await notificationLink.click();
  await expect(page).toHaveURL(/\/dashboard\/admin\/disputes$/);
  expect(markedRead).toBe(true);
});
