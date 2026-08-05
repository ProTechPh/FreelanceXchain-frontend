import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getRealtimeMessage,
  getDashboardMessageRoute,
  getConversationlessContacts,
  getDirectMessageRoute,
  getInitialConversationId,
  mergeConversationMessages,
} from './dashboard-message-route.ts';

test('returns the employer messages route for employer accounts', () => {
  assert.equal(
    getDashboardMessageRoute('employer'),
    '/dashboard/employer/messages',
  );
});

test('keeps the existing freelancer messages route', () => {
  assert.equal(
    getDashboardMessageRoute('freelancer'),
    '/dashboard/freelancer/messages',
  );
});

test('does not expose the participant chat route to administrators', () => {
  assert.equal(getDashboardMessageRoute('admin'), null);
});

test('builds an employer chat link for an accepted freelancer proposal', () => {
  assert.equal(
    getDirectMessageRoute('employer', 'freelancer-1'),
    '/dashboard/employer/messages?recipientId=freelancer-1',
  );
});

test('selects an existing conversation with the requested recipient', () => {
  const conversations = [
    { id: 'conversation-1', otherUser: { id: 'freelancer-1' } },
    { id: 'conversation-2', otherUser: { id: 'freelancer-2' } },
  ];

  assert.equal(
    getInitialConversationId(conversations, 'freelancer-2'),
    'conversation-2',
  );
});

test('keeps a new direct chat unselected until its first message creates a conversation', () => {
  const conversations = [
    { id: 'conversation-1', otherUser: { id: 'freelancer-1' } },
  ];

  assert.equal(getInitialConversationId(conversations, 'freelancer-2'), null);
  assert.equal(getInitialConversationId(conversations, null), 'conversation-1');
});

test('shows accepted freelancers who do not have a conversation yet', () => {
  const conversations = [
    { id: 'conversation-1', otherUser: { id: 'freelancer-1' } },
  ];
  const acceptedContacts = [
    { id: 'freelancer-1', name: 'Existing Freelancer' },
    { id: 'freelancer-2', name: 'Newly Accepted Freelancer' },
    { id: 'freelancer-2', name: 'Newly Accepted Freelancer' },
  ];

  assert.deepEqual(
    getConversationlessContacts(conversations, acceptedContacts),
    [{ id: 'freelancer-2', name: 'Newly Accepted Freelancer' }],
  );
});

test('extracts the complete message carried by a realtime notification', () => {
  const message = {
    id: 'message-1',
    conversation_id: 'conversation-1',
    sender_id: 'employer-1',
    receiver_id: 'freelancer-1',
    content: 'Hello',
    is_read: false,
    created_at: '2026-08-05T17:23:16.493Z',
    updated_at: '2026-08-05T17:23:16.493Z',
  };

  assert.deepEqual(getRealtimeMessage({ message }), message);
  assert.equal(getRealtimeMessage({ message: { id: 'message-1' } }), null);
  assert.equal(getRealtimeMessage({
    message: { ...message, content: 42 },
  }), null);
  assert.equal(getRealtimeMessage(null), null);
});

test('retains a realtime message while the immediate history query is still empty', () => {
  const realtimeMessage = {
    id: 'message-1',
    conversation_id: 'conversation-1',
    content: 'Hello',
  };

  assert.deepEqual(
    mergeConversationMessages([], [realtimeMessage]),
    [realtimeMessage],
  );

  assert.deepEqual(
    mergeConversationMessages([realtimeMessage], [realtimeMessage]),
    [realtimeMessage],
  );
});
