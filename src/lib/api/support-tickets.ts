import api from '@/lib/api-client';
import type {
  AdminSupportTicket,
  SupportTicket,
  SupportTicketCategory,
  SupportTicketStats,
  SupportTicketStatus,
} from '@/types';

/**
 * Customer support tickets — a user asking the platform for help.
 *
 * Not to be confused with `disputesApi` in ./disputes.ts, which is one party
 * escalating against the other over a contract, or `appRatingsApi`, which is
 * feedback nobody replies to.
 *
 * `submit` and `listMine` are identical for freelancers and employers; the
 * server derives the role from the session.
 */
export const supportTicketsApi = {
  submit: (data: { subject: string; description: string; category: SupportTicketCategory }) =>
    api.post<SupportTicket>('/support-tickets', data),

  /** The caller's own tickets, newest first, including any admin reply. */
  listMine: () => api.get<SupportTicket[]>('/support-tickets/me'),

  /** Rows for the filter plus the counts for every filter, in one round trip. */
  adminList: (params?: { status?: SupportTicketStatus; category?: SupportTicketCategory }) =>
    api.get<{ tickets: AdminSupportTicket[]; total: number; stats: SupportTicketStats }>(
      '/support-tickets/admin',
      { params }
    ),

  /** `resolutionNote` is required by the server when `status` is 'resolved'. */
  adminUpdateStatus: (id: string, body: { status: SupportTicketStatus; resolutionNote?: string }) =>
    api.patch<SupportTicket>(`/support-tickets/admin/${id}/status`, body),
};
