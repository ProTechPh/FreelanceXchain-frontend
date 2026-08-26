'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { qk, STALE_TIME } from '@/lib/query-keys';
import type { AnalyticsDateRange, EmployerAnalytics, FreelancerAnalytics } from '@/types';

export function useFreelancerAnalytics(range: AnalyticsDateRange, enabled = true) {
  return useQuery<FreelancerAnalytics>({
    queryKey: qk.analytics('freelancer', range),
    queryFn: async () => (await analyticsApi.getFreelancer(range)).data,
    staleTime: STALE_TIME.short,
    enabled,
  });
}

export function useEmployerAnalytics(range: AnalyticsDateRange, enabled = true) {
  return useQuery<EmployerAnalytics>({
    queryKey: qk.analytics('employer', range),
    queryFn: async () => (await analyticsApi.getEmployer(range)).data,
    staleTime: STALE_TIME.short,
    enabled,
  });
}
