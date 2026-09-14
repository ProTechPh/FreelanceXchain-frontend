import api from '@/lib/api-client';
import type {
  Message,
  ConversationWithDetails,
  Notification,
  Attachment,
} from '@/types';

export type SenderProfile = {
  key: string;
  name: string;
  email: string;
  description: string;
};

export const messagesApi = {
  getConversations: () =>
    api.get<{ items: ConversationWithDetails[]; total: number; hasMore: boolean }>(
      '/messages/conversations'
    ),

  getConversationMessages: (conversationId: string, params?: { page?: number; limit?: number }) =>
    api.get<{ items: Message[]; total: number; hasMore: boolean }>(
      `/messages/conversations/${conversationId}`,
      { params }
    ),

  send: (receiverId: string, content: string, attachments?: Attachment[]) =>
    api.post<Message>('/messages/send', { receiverId, content, attachments }),

  markConversationRead: (conversationId: string) =>
    api.patch<{ message: string }>(`/messages/conversations/${conversationId}/read`),

  getUnreadCount: () =>
    api.get<{ count: number }>('/messages/unread-count'),
};

export const notificationsApi = {
  list: (params?: { maxItemCount?: number; continuationToken?: string }) =>
    api.get<{ items: Notification[]; continuationToken?: string; hasMore: boolean }>(
      '/notifications',
      { params }
    ),

  markRead: (id: string) =>
    api.patch<Notification>(`/notifications/${id}/read`),

  markAllRead: () =>
    api.patch<{ count: number }>('/notifications/read-all'),

  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count'),
};

export const emailApi = {
  list: (params?: { folder?: string; limit?: number; offset?: number; isRead?: boolean }) =>
    api.get('/inbox', { params }),

  getUnreadCount: (folder?: string) =>
    api.get<{ count: number }>('/inbox/unread-count', { params: { folder } }),

  getProfiles: () =>
    api.get<{ profiles: SenderProfile[] }>('/inbox/profiles'),

  getById: (id: string) =>
    api.get(`/inbox/${id}`),

  update: (id: string, data: { is_read?: boolean; is_starred?: boolean; folder?: string }) =>
    api.patch(`/inbox/${id}`, data),

  delete: (id: string) =>
    api.delete(`/inbox/${id}`),

  send: (data: { to: string; subject: string; text: string; html?: string; senderProfile?: string; senderName?: string }) =>
    api.post('/inbox/send', data),

  reply: (id: string, data: { text: string; html?: string; senderProfile?: string; senderName?: string }) =>
    api.post(`/inbox/${id}/reply`, data),
};
