import type { AuditLogEntry, AuditLogSearchResponse } from '@/types';

export type AuditLogStatus = 'success' | 'failure' | 'pending';

const VALID_STATUSES: AuditLogStatus[] = ['success', 'failure', 'pending'];

export const AUDIT_SEARCH_PAGE_SIZE = 50;

export interface AuditSearchFilters {
  actor?: string;
  user?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  cursor?: string;
}

/** Exactly the query params GET /audit-logs/search reads. */
export interface AuditSearchParams {
  actor?: string;
  user?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  status?: AuditLogStatus;
  startDate?: string;
  endDate?: string;
  limit?: number;
  cursor?: string;
}

export function isAuditLogStatus(value: unknown): value is AuditLogStatus {
  return typeof value === 'string' && VALID_STATUSES.includes(value as AuditLogStatus);
}

/**
 * Strip filters the API would ignore or reject.
 *
 * The backend only applies a string filter when it is non-empty, and answers 400
 * for a `status` outside the enum — so an empty input box must produce an absent
 * param, not `?action=`. Dropping empties also keeps the React Query cache key
 * stable across "" and undefined, which would otherwise be two separate entries.
 */
export function buildAuditSearchParams(filters: AuditSearchFilters): AuditSearchParams {
  const params: AuditSearchParams = {};

  const text: Array<keyof Pick<AuditSearchFilters, 'actor' | 'user' | 'action' | 'resourceType' | 'resourceId' | 'startDate' | 'endDate' | 'cursor'>> = [
    'actor', 'user', 'action', 'resourceType', 'resourceId', 'startDate', 'endDate', 'cursor',
  ];

  for (const key of text) {
    const value = filters[key];
    if (typeof value === 'string' && value.trim() !== '') {
      params[key] = value.trim();
    }
  }

  if (isAuditLogStatus(filters.status)) {
    params.status = filters.status;
  }

  if (typeof filters.limit === 'number' && Number.isFinite(filters.limit)) {
    params.limit = clampAuditLimit(filters.limit);
  }

  return params;
}

/** The route parses `limit` with parseInt and only applies it when > 0. */
export function clampAuditLimit(limit: number): number {
  const rounded = Math.floor(limit);
  if (rounded < 1) return 1;
  if (rounded > 200) return 200;
  return rounded;
}

/**
 * Accumulate a cursor page onto the rows already shown. Entries are de-duplicated
 * by id: a row written between two page fetches shifts the cursor window and can
 * otherwise surface twice.
 */
export function appendCursorPage(
  previous: AuditLogEntry[],
  page: AuditLogSearchResponse,
): AuditLogEntry[] {
  const seen = new Set(previous.map((entry) => entry.id));
  return [...previous, ...page.items.filter((entry) => !seen.has(entry.id))];
}

export function hasActiveAuditFilters(filters: AuditSearchFilters): boolean {
  const params = buildAuditSearchParams({ ...filters, cursor: undefined, limit: undefined });
  return Object.keys(params).length > 0;
}
