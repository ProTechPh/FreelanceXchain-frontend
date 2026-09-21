import api from '@/lib/api-client';
import type {
  Contract,
  Milestone,
  MilestoneApprovalResult,
  Dispute,
  PaginatedResponse,
  RushUpgradeRequest,
  RefundRequest,
  ContractFundInfo,
  ContractPaymentStatus,
  ContractPaymentHistory,
  MyPaymentsResponse,
  PaymentSummary,
  Transaction,
} from '@/types';

export const contractsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Contract>>('/contracts', { params }),
  
  get: (id: string) =>
    api.get<Contract>(`/contracts/${id}`),

  fund: (id: string, payload?: { escrowAddress?: string; transactionHash?: string }) =>
    api.post<{ message: string; escrowAddress: string; contractStatus: Contract['status'] }>(`/contracts/${id}/fund`, payload),

  getFundInfo: (id: string) =>
    api.get<ContractFundInfo>(`/contracts/${id}/fund-info`),
  
  cancel: (id: string) =>
    api.post<{ message: string }>(`/contracts/${id}/cancel`),

  getDisputes: (id: string) =>
    api.get<Dispute[]>(`/contracts/${id}/disputes`),
};

export const rushUpgradesApi = {
  list: (contractId: string) =>
    api.get<RushUpgradeRequest[]>(`/contracts/${contractId}/rush-upgrade-requests`),

  request: (contractId: string, proposedPercentage: number) =>
    api.post<RushUpgradeRequest>(`/contracts/${contractId}/rush-upgrade`, { proposedPercentage }),

  respond: (requestId: string, action: 'accept' | 'decline' | 'counter_offer', counterPercentage?: number) =>
    api.post<RushUpgradeRequest | { request: RushUpgradeRequest; contract: Contract }>(
      `/rush-upgrade-requests/${requestId}/respond`,
      { action, ...(counterPercentage === undefined ? {} : { counterPercentage }) },
    ),

  acceptCounter: (requestId: string, payload?: { transactionHash?: string }) =>
    api.post<{ request: RushUpgradeRequest; contract: Contract }>(`/rush-upgrade-requests/${requestId}/accept-counter`, payload),

  pay: (requestId: string, payload?: { transactionHash?: string }) =>
    api.post<{ request: RushUpgradeRequest; contract: Contract }>(`/rush-upgrade-requests/${requestId}/pay`, payload),

  declineCounter: (requestId: string) =>
    api.post<RushUpgradeRequest>(`/rush-upgrade-requests/${requestId}/decline-counter`),

  withdraw: (requestId: string) =>
    api.post<{ message: string }>(`/rush-upgrade-requests/${requestId}/withdraw`),
};

export const refundsApi = {
  list: (contractId: string) =>
    api.get<RefundRequest[]>(`/escrow/${contractId}/refunds`),

  request: (contractId: string, data: { reason: string; amount?: number }) =>
    api.post<RefundRequest>(`/escrow/${contractId}/refund-request`, data),

  approve: (refundId: string) =>
    api.post<RefundRequest>(`/escrow/refunds/${refundId}/approve`),

  reject: (refundId: string, reason: string) =>
    api.post<RefundRequest>(`/escrow/refunds/${refundId}/reject`, { reason }),

  withdraw: (refundId: string) =>
    api.post<{ message: string }>(`/escrow/refunds/${refundId}/withdraw`),
};

export const milestonesApi = {
  listForContract: (contractId: string) =>
    api.get<Milestone[]>(`/milestones/contract/${contractId}`),

  submitWithFiles: (milestoneId: string, data: FormData) =>
    api.post<Milestone>(`/milestones/${milestoneId}/submit-with-files`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Returns the approval outcome, not the milestone: the endpoint delegates to
  // payment-service.approveMilestone, which releases escrow and reports whether
  // that was the last milestone (`contractCompleted`).
  approve: (milestoneId: string, feedback?: string) =>
    api.post<MilestoneApprovalResult>(`/milestones/${milestoneId}/approve`, { feedback }),

  reject: (milestoneId: string, reason: string, requestRevision = true) =>
    api.post<Milestone>(`/milestones/${milestoneId}/reject`, { reason, requestRevision }),
};

export const paymentsApi = {
  completeMilestone: (contractId: string, milestoneId: string) =>
    api.post(`/payments/milestones/${milestoneId}/complete`, undefined, { params: { contractId } }),
  
  approveMilestone: (contractId: string, milestoneId: string) =>
    api.post(`/payments/milestones/${milestoneId}/approve`, undefined, { params: { contractId } }),
  
  disputeMilestone: (contractId: string, milestoneId: string, reason: string) =>
    api.post(`/payments/milestones/${milestoneId}/dispute`, { reason }, { params: { contractId } }),
  
  getStatus: (contractId: string) =>
    api.get<ContractPaymentStatus>(`/payments/contracts/${contractId}/status`),

  getHistory: (contractId: string) =>
    api.get<ContractPaymentHistory>(`/payments/contracts/${contractId}/history`),

  getMine: (params?: { limit?: number; offset?: number }) =>
    api.get<MyPaymentsResponse>('/payments/me', { params }),

  getSummary: () =>
    api.get<PaymentSummary>('/payments/summary'),
};

export const transactionsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Transaction>>('/transactions', { params }),

  get: (id: string) =>
    api.get<Transaction>(`/transactions/${id}`),

  getForContract: (contractId: string) =>
    api.get<Transaction[]>(`/transactions/contract/${contractId}`),
};
