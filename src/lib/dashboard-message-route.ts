type DashboardRole = 'freelancer' | 'employer' | 'admin';

export function getDashboardMessageRoute(role: 'freelancer' | 'employer'): string;
export function getDashboardMessageRoute(role: 'admin'): null;
export function getDashboardMessageRoute(role: DashboardRole): string | null {
  if (role === 'freelancer' || role === 'employer') {
    return `/dashboard/${role}/messages`;
  }

  return null;
}

export function getDirectMessageRoute(
  role: 'freelancer' | 'employer',
  recipientId: string,
  projectId?: string,
): string {
  const base = `${getDashboardMessageRoute(role)}?recipientId=${encodeURIComponent(recipientId)}`;
  return projectId ? `${base}&projectId=${encodeURIComponent(projectId)}` : base;
}

interface ConversationTarget {
  id: string;
  otherUser: {
    id: string;
  };
}

export function getInitialConversationId(
  conversations: ConversationTarget[],
  recipientId: string | null,
): string | null {
  if (recipientId) {
    return conversations.find((conversation) => conversation.otherUser.id === recipientId)?.id ?? null;
  }

  return conversations[0]?.id ?? null;
}

interface MessageContact {
  id: string;
}

export function getConversationlessContacts<TContact extends MessageContact>(
  conversations: ConversationTarget[],
  contacts: TContact[],
): TContact[] {
  const seenUserIds = new Set(conversations.map((conversation) => conversation.otherUser.id));

  return contacts.filter((contact) => {
    if (seenUserIds.has(contact.id)) return false;
    seenUserIds.add(contact.id);
    return true;
  });
}

interface MessageIdentity {
  id: string;
  conversation_id: string;
}

export function getRealtimeMessage<TMessage extends MessageIdentity>(data: unknown): TMessage | null {
  if (!data || typeof data !== 'object') return null;

  const message = (data as Record<string, unknown>).message;
  if (!message || typeof message !== 'object') return null;

  const candidate = message as Record<string, unknown>;
  const requiredStringFields = [
    'id',
    'conversation_id',
    'sender_id',
    'receiver_id',
    'content',
    'created_at',
    'updated_at',
  ];
  if (
    requiredStringFields.some((field) => typeof candidate[field] !== 'string') ||
    typeof candidate.is_read !== 'boolean'
  ) {
    return null;
  }

  return message as TMessage;
}

export function mergeConversationMessages<TMessage extends { id: string }>(
  fetchedMessages: TMessage[],
  realtimeMessages: TMessage[],
): TMessage[] {
  const seenMessageIds = new Set<string>();

  return [...fetchedMessages, ...realtimeMessages].filter((message) => {
    if (seenMessageIds.has(message.id)) return false;
    seenMessageIds.add(message.id);
    return true;
  });
}
