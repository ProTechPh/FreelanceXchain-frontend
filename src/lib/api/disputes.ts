import api from '@/lib/api-client';
import type {
  Dispute,
  DisputeEvidence,
} from '@/types';

export const disputesApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<{ items: Dispute[]; continuationToken?: string | null }>('/disputes', { params }),

  create: (data: Pick<Dispute, 'contractId' | 'milestoneId' | 'reason'>) =>
    api.post<Dispute>('/disputes', data),

  get: (id: string) =>
    api.get<Dispute>(`/disputes/${id}`),

  submitEvidenceFiles: (id: string, data: FormData) =>
    api.post<Dispute>(`/disputes/${id}/evidence`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  submitEvidence: (id: string, type: 'text' | 'link', content: string) =>
    api.post<Dispute>(`/disputes/${id}/evidence`, { type, content }),

  listEvidence: (id: string) =>
    api.get<DisputeEvidence[]>(`/disputes/${id}/evidence`),

  deleteEvidence: (disputeId: string, evidenceId: string) =>
    api.delete<{ message: string }>(`/disputes/${disputeId}/evidence/${evidenceId}`),

  verifyEvidence: (disputeId: string, evidenceId: string) =>
    api.post<DisputeEvidence>(`/disputes/${disputeId}/evidence/${evidenceId}/verify`),

  resolve: (disputeId: string, decision: 'freelancer_favor' | 'employer_favor', reasoning: string) =>
    api.post<Dispute>(`/disputes/${disputeId}/resolve`, { decision, reasoning }),
};
