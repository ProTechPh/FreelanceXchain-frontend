'use client';

import { useState, useMemo, useCallback } from 'react';
import { useUser } from '@/stores/authStore';
import { useEmployerAnalytics } from '@/hooks/use-analytics';
import { usePlan } from '@/hooks/use-plan';
import { DEFAULT_RANGE_PRESET, resolveRange, type RangePresetId } from '@/lib/analytics-range';
import { useEmployerProjects } from '@/hooks/use-employer-projects';
import { useEmployerProposals, type RecentProposalView } from '@/hooks/use-employer-proposals';
import { useEmployerContracts, type RecommendedFreelancerView } from '@/hooks/use-employer-contracts';

export type { RecentProposalView, RecommendedFreelancerView };

export { useEmployerProjects } from '@/hooks/use-employer-projects';
export { useEmployerProposals } from '@/hooks/use-employer-proposals';
export { useEmployerContracts } from '@/hooks/use-employer-contracts';

export function useEmployerDashboard() {
  const currentUser = useUser();
  const [range, setRange] = useState<RangePresetId>(DEFAULT_RANGE_PRESET);

  const analyticsRange = useMemo(() => resolveRange(range, new Date()), [range]);
  const { isPro } = usePlan();
  const { data: analytics } = useEmployerAnalytics(analyticsRange, Boolean(currentUser));
  const totalSpent = analytics?.totalSpent ?? null;
  const completedContractCount = analytics?.projectsCompleted ?? null;

  const {
    projects,
    activeProjects,
    projectsLoading,
    reloadProjects,
  } = useEmployerProjects();

  const {
    pendingProposalCount,
    recentProposals,
    proposalsLoading,
    reloadProposals,
  } = useEmployerProposals(activeProjects, projectsLoading);

  const {
    recommended,
    recommendedLoading,
    reloadContracts,
  } = useEmployerContracts(activeProjects, projectsLoading);

  const loading = projectsLoading || proposalsLoading;

  const reload = useCallback(() => {
    reloadProjects();
    reloadProposals();
    reloadContracts();
  }, [reloadProjects, reloadProposals, reloadContracts]);

  return {
    currentUser,
    loading,
    coreLoading: projectsLoading,
    range,
    setRange,
    projects,
    activeProjects,
    pendingProposalCount,
    recentProposals,
    recommended,
    recommendedLoading,
    isPro,
    totalSpent,
    completedContractCount,
    reload,
  };
}
