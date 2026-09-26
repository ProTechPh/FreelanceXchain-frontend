import { expect, test, type Page } from '@playwright/test';

const createdAt = '2026-08-06T00:00:00.000Z';
const me = { id: 'freelancer-1', email: 'f@example.com', name: 'Maria', role: 'freelancer',
  walletAddress: '', kycStatus: 'approved', createdAt, updatedAt: createdAt };
const alex = { id: 'alex-1', name: 'Alex Rivera', email: 'alex@example.com', role: 'employer' };
const tech = { id: 'tech-1', name: 'TechVentures Inc.', email: 'tech@example.com', role: 'employer' };
const nova = { id: 'nova-1', name: 'Nova Labs', email: 'nova@example.com', role: 'employer' };

const project = { id: 'project-6', title: 'DeFi Yield Aggregator', description: 'Yield aggregator.',
  budget: 18000, status: 'open', employerId: alex.id, requiredSkills: [], createdAt, updatedAt: createdAt };

const conversation = (id: string, otherUser: typeof tech, preview: string) => ({
  id, participant1_id: me.id, participant2_id: otherUser.id,
  unread_count_1: 0, unread_count_2: 0, last_message_at: createdAt,
  created_at: createdAt, updated_at: createdAt,
  otherUser, lastMessage: { content: preview, created_at: createdAt },
});

const conversations = [
  conversation('conv-tech', tech, 'yow are we done?'),
  conversation('conv-nova', nova, 'sounds good'),
];

const thread = (conversationId: string, otherId: string, content: string) => ({
  items: [{ id: `m-${conversationId}`, conversation_id: conversationId, sender_id: otherId,
    receiver_id: me.id, content, created_at: createdAt, read: true, attachments: [] }],
  total: 1, hasMore: false,
});

async function setup(page: Page) {
  await page.addInitScript((u) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: u, isAuthenticated: true }, version: 0 }));
  }, me);
  await page.route('**/api/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/notifications/stream', (r) => r.fulfill({ status: 200, contentType: 'text/event-stream', body: '' }));
  await page.route('**/api/notifications/unread-count', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }));
  await page.route('**/api/contracts?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], hasMore: false, total: 0 }) }));
  await page.route('**/api/messages/conversations', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: conversations, total: conversations.length, hasMore: false }) }));
  await page.route('**/api/messages/conversations/conv-tech**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(thread('conv-tech', tech.id, 'yow are we done?')) }));
  await page.route('**/api/messages/conversations/conv-nova**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(thread('conv-nova', nova.id, 'sounds good')) }));
  await page.route('**/api/projects/project-6', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(project) }));
  await page.route(`**/api/employers/${alex.id}**`, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(alex) }));
  await page.route('**/api/auth/me', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: me }) }));
  await page.setViewportSize({ width: 1400, height: 900 });
}

const composerOf = (page: Page) => page.getByRole('textbox', { name: 'Message' });
const bannerOf = (page: Page) => page.getByText('Inquiring Project');

test('the inquiry banner and seeded draft belong to the chat they were opened for', async ({ page }) => {
  await setup(page);
  await page.goto(`/dashboard/freelancer/messages?recipientId=${alex.id}&projectId=project-6`);

  await expect(bannerOf(page)).toBeVisible();
  await expect(composerOf(page)).toHaveValue(/DeFi Yield Aggregator/);

  await page.getByRole('button', { name: /TechVentures/ }).click();
  await expect(page.getByText('yow are we done?')).toBeVisible();

  await expect(bannerOf(page)).toHaveCount(0);
  await expect(composerOf(page)).toHaveValue('');
  await expect(page).toHaveURL(/\/dashboard\/freelancer\/messages$/);
});

test('sending the first message does not end the inquiry', async ({ page }) => {
  await setup(page);
  await page.route('**/api/messages', (r) => {
    if (r.request().method() !== 'POST') return r.fallback();
    return r.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({
      id: 'm-new', conversation_id: 'conv-alex', sender_id: me.id, receiver_id: alex.id,
      content: 'Hi! I am reaching out regarding your project "DeFi Yield Aggregator".',
      created_at: createdAt, read: false, attachments: [] }) });
  });

  await page.goto(`/dashboard/freelancer/messages?recipientId=${alex.id}&projectId=project-6`);
  await expect(composerOf(page)).toHaveValue(/DeFi Yield Aggregator/);

  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(composerOf(page)).toHaveValue('');
  await expect(bannerOf(page)).toBeVisible();
});

test('an unsent draft stays with its own conversation', async ({ page }) => {
  await setup(page);
  await page.goto('/dashboard/freelancer/messages');

  await page.getByRole('button', { name: /TechVentures/ }).click();
  await composerOf(page).fill('half-written note for TechVentures');

  await page.getByRole('button', { name: /Nova Labs/ }).click();
  await expect(page.getByText('sounds good')).toBeVisible();
  await expect(composerOf(page)).toHaveValue('');

  await page.getByRole('button', { name: /TechVentures/ }).click();
  await expect(composerOf(page)).toHaveValue('half-written note for TechVentures');
});

test('View Project opens in the same tab', async ({ page }) => {
  await setup(page);
  await page.goto(`/dashboard/freelancer/messages?recipientId=${alex.id}&projectId=project-6`);

  const link = page.getByRole('link', { name: /View Project/ });
  await expect(link).toBeVisible();
  await expect(link).not.toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('href', '/dashboard/freelancer/projects/project-6');

  await link.click();
  await expect(page).toHaveURL(/\/dashboard\/freelancer/);
  expect(page.context().pages()).toHaveLength(1);
});

test('a scraped project reference is ignored unless it belongs to the conversation', async ({ page }) => {
  const employer = { id: 'employer-9', email: 'e@example.com', name: 'Acme', role: 'employer',
    walletAddress: '', kycStatus: 'approved', createdAt, updatedAt: createdAt };
  const maria = { id: 'maria-1', name: 'Maria Santos', email: 'maria@example.com', role: 'freelancer' };

  const strangersProject = { id: 'project-x', title: 'Cross-Chain Bridge UI',
    description: 'Bridge UI.', budget: 5500, status: 'open', employerId: 'someone-else',
    requiredSkills: [], createdAt, updatedAt: createdAt };

  const conv = { id: 'conv-maria', participant1_id: employer.id, participant2_id: maria.id,
    unread_count_1: 0, unread_count_2: 0, last_message_at: createdAt,
    created_at: createdAt, updated_at: createdAt, otherUser: maria,
    lastMessage: { content: 'Hi! I am reaching out regarding your project "Cross-Chain Bridge UI".', created_at: createdAt } };

  await page.addInitScript((u) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: u, isAuthenticated: true }, version: 0 }));
  }, employer);
  await page.route('**/api/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/notifications/stream', (r) => r.fulfill({ status: 200, contentType: 'text/event-stream', body: '' }));
  await page.route('**/api/notifications/unread-count', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }));
  await page.route('**/api/contracts?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], hasMore: false, total: 0 }) }));
  await page.route('**/api/auth/me', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: employer }) }));
  await page.route('**/api/messages/conversations', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [conv], total: 1, hasMore: false }) }));
  await page.route('**/api/messages/conversations/conv-maria**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [
    { id: 'mm1', conversation_id: 'conv-maria', sender_id: maria.id, receiver_id: employer.id,
      content: 'Hi! I am reaching out regarding your project "Cross-Chain Bridge UI".',
      created_at: createdAt, read: true, attachments: [] },
  ], total: 1, hasMore: false }) }));
  await page.route('**/api/projects?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [strangersProject], total: 1, hasMore: false }) }));
  await page.setViewportSize({ width: 1400, height: 900 });

  await page.goto('/dashboard/employer/messages');
  await page.getByRole('button', { name: /Maria Santos/ }).click();
  await expect(page.getByText('reaching out regarding your project').first()).toBeVisible();

  await expect(bannerOf(page)).toHaveCount(0);
  await expect(page.getByText('$5,500')).toHaveCount(0);
});

test('the empty-inbox button goes to the dashboard project list, per role', async ({ page }) => {
  const freelancer = { id: 'freelancer-9', email: 'f9@example.com', name: 'Ana Reyes', role: 'freelancer',
    walletAddress: '', kycStatus: 'approved', createdAt, updatedAt: createdAt };

  await page.addInitScript((u) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: u, isAuthenticated: true }, version: 0 }));
  }, freelancer);
  await page.route('**/api/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/notifications/stream', (r) => r.fulfill({ status: 200, contentType: 'text/event-stream', body: '' }));
  await page.route('**/api/notifications/unread-count', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }));
  await page.route('**/api/contracts?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], hasMore: false, total: 0 }) }));
  await page.route('**/api/messages/conversations', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, hasMore: false }) }));
  await page.route('**/api/search/projects**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, hasMore: false }) }));
  await page.route('**/api/auth/me', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: freelancer }) }));
  await page.setViewportSize({ width: 1400, height: 900 });

  await page.goto('/dashboard/freelancer/messages');
  await expect(page.getByText('No conversations yet')).toBeVisible();

  const browse = page.locator('#dashboard-content').getByRole('link', { name: /Browse projects/i });
  await expect(browse).toHaveAttribute('href', '/dashboard/freelancer/projects');

  await browse.click();
  await expect(page).toHaveURL(/\/dashboard\/freelancer\/projects$/);
});
