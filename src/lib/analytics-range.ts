import type { AnalyticsDateRange } from '@/types';

export type RangePresetId = '7d' | '30d' | '90d' | 'all';

export interface RangePreset {
  id: RangePresetId;
  label: string;
  /** null means "no date filter" — the API then returns the lifetime view. */
  days: number | null;
}

export const RANGE_PRESETS: RangePreset[] = [
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
  { id: 'all', label: 'All time', days: null },
];

export const DEFAULT_RANGE_PRESET: RangePresetId = 'all';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Resolve a preset into the startDate/endDate the analytics endpoints accept.
 *
 * `now` is a required argument rather than an internal `new Date()` so tests are
 * deterministic and so a server render and the client hydration cannot disagree.
 * 'all' resolves to an empty object: omitting the params is what makes the API
 * return the unfiltered lifetime view, and it also keeps the cache key stable
 * (the backend keys its 60s LRU on `{userId}:{startDate}:{endDate}`).
 */
export function resolveRange(preset: RangePresetId, now: Date): AnalyticsDateRange {
  const found = RANGE_PRESETS.find((p) => p.id === preset);
  if (!found || found.days === null) return {};
  return {
    startDate: new Date(now.getTime() - found.days * DAY_MS).toISOString(),
    endDate: now.toISOString(),
  };
}

export function getRangeLabel(preset: RangePresetId): string {
  return RANGE_PRESETS.find((p) => p.id === preset)?.label ?? 'All time';
}
