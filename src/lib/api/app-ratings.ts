import api from '@/lib/api-client';
import type {
  AdminAppRating,
  AppRating,
  AppRatingEligibility,
  AppRatingSource,
  AppRatingSummary,
} from '@/types';

/**
 * "Rate the app" — feedback about the platform itself.
 *
 * Not to be confused with `reviewsApi` in ./features.ts, which is one party
 * rating the other on a completed contract.
 */
export const appRatingsApi = {
  submit: (data: {
    rating: number;
    comment?: string;
    source: AppRatingSource;
    contextId?: string;
  }) => api.post<AppRating>('/app-ratings', data),

  /** Whether the server will accept a prompt-driven rating right now. */
  getEligibility: () => api.get<AppRatingEligibility>('/app-ratings/eligibility'),

  adminList: (params?: { source?: string; rating?: number }) =>
    api.get<{ ratings: AdminAppRating[]; total: number }>('/app-ratings/admin', { params }),

  adminSummary: () => api.get<AppRatingSummary>('/app-ratings/admin/summary'),
};
