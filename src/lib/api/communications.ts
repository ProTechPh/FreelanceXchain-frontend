import api from '@/lib/api-client';
import type {
  Message,
  ConversationWithDetails,
  Notification,
  Attachment,
} from '@/types';


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
