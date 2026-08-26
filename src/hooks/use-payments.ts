'use client';

import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';
import { qk, STALE_TIME } from '@/lib/query-keys';

/**
 * The contract money ledger. The backend does not cache this one, so it reflects a
 * milestone release or refund immediately — unlike the totals below.
 */
export function useContractPaymentHistory(contractId: string, enabled = true) {
  return useQuery({
    queryKey: qk.contractPayments(contractId),
    queryFn: async () => (await paymentsApi.getHistory(contractId)).data,
    staleTime: STALE_TIME.none,
    enabled: enabled && Boolean(contractId),
  });
}

export function useMyPayments(limit = 20, offset = 0) {
  return useQuery({
    queryKey: qk.myPayments(limit, offset),
    queryFn: async () => (await paymentsApi.getMine({ limit, offset })).data,
    staleTime: STALE_TIME.short,
  });
}

/** Lifetime totals. Cached 60s per user server-side, so they can lag a mutation. */
export function usePaymentSummary() {
  return useQuery({
    queryKey: qk.paymentSummary(),
    queryFn: async () => (await paymentsApi.getSummary()).data,
    staleTime: STALE_TIME.short,
  });
}
