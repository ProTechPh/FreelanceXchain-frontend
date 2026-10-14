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
  /**
   * `continuationToken` is the id of the last notification already loaded;
   * `archived: true` lists the archive instead of the inbox.
   */
  list: (params?: { maxItemCount?: number; continuationToken?: string; archived?: boolean }) =>
    api.get<{ items: Notification[]; continuationToken?: string; hasMore: boolean }>(
      '/notifications',
      { params }
    ),

  markRead: (id: string) =>
    api.patch<Notification>(`/notifications/${id}/read`),

  markAllRead: () =>
    api.patch<{ count: number }>('/notifications/read-all'),

  archive: (id: string) =>
    api.patch<Notification>(`/notifications/${encodeURIComponent(id)}/archive`),

  unarchive: (id: string) =>
    api.patch<Notification>(`/notifications/${encodeURIComponent(id)}/unarchive`),

  remove: (id: string) =>
    api.delete<{ id: string }>(`/notifications/${encodeURIComponent(id)}`),

  /** One action over up to 100 ids; ids that are missing or not yours come back in `failed`. */
  bulk: (action: 'archive' | 'unarchive' | 'delete', ids: string[]) =>
    api.post<{ action: string; succeeded: string[]; failed: string[] }>('/notifications/bulk', { action, ids }),

  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count'),
};
