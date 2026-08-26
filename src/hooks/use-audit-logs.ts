'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '@/lib/api';
import { qk, STALE_TIME } from '@/lib/query-keys';
import type { AuditSearchParams } from '@/lib/audit-log-search';

/**
 * Cursor-paginated audit search. `nextCursor` is null on the last page, which is
 * what stops the fetch — the API returns it alongside `hasMore`.
 */
export function useAuditLogSearchInfinite(params: AuditSearchParams, enabled = true) {
  return useInfiniteQuery({
    queryKey: qk.auditSearch(params),
    queryFn: async ({ pageParam }) =>
      (await auditLogsApi.search({ ...params, cursor: pageParam ?? undefined })).data,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: STALE_TIME.short,
    enabled,
  });
}

export function useAdminActivitySummary(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: qk.adminActivity(startDate, endDate),
    queryFn: async () => (await auditLogsApi.getAdminActivitySummary(startDate, endDate)).data,
    staleTime: STALE_TIME.short,
    enabled: enabled && Boolean(startDate) && Boolean(endDate),
  });
}
