import type { AnalyticsDateRange } from '@/types';
import type { AuditSearchParams } from '@/lib/audit-log-search';

/**
 * Query key factory. Centralised so invalidation after a mutation targets the same
 * key the hook registered — a stringly-typed key that drifts silently stops
 * invalidating and the UI quietly serves stale data.
 */
export const qk = {
  contractPayments: (contractId: string) => ['payments', 'contract', contractId] as const,
  myPayments: (limit: number, offset: number) => ['payments', 'me', limit, offset] as const,
  paymentSummary: () => ['payments', 'summary'] as const,
  analytics: (role: 'freelancer' | 'employer', range: AnalyticsDateRange) =>
    ['analytics', role, range.startDate ?? null, range.endDate ?? null] as const,
  auditSearch: (params: AuditSearchParams) => ['audit-logs', 'search', params] as const,
  adminActivity: (startDate: string, endDate: string) =>
    ['audit-logs', 'admin-activity', startDate, endDate] as const,
};

/**
 * staleTime values mirroring the API's server-side LRU TTLs
 * (FreelanceXchain-api src/utils/cache.ts). Refetching sooner than the server TTL
 * just re-reads the same cached value over the wire, so these are the floor.
 */
export const STALE_TIME = {
  /** freelancer/employer/admin analytics, payment summary and /payments/me totals */
  short: 60_000,
  /** the contract payment ledger is uncached server-side, so it can be read fresh */
  none: 0,
} as const;
