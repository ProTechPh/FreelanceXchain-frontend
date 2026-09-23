'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { reputationApi } from '@/lib/api';
import { useUser } from '@/stores/authStore';
import { useFreelancerAnalytics } from '@/hooks/use-analytics';
import { DEFAULT_RANGE_PRESET, resolveRange, type RangePresetId } from '@/lib/analytics-range';
import { reportLoadFailure } from '@/lib/report-failure';
import { usePlan } from '@/hooks/use-plan';

import { useFreelancerContracts, ActiveContractView } from './use-freelancer-contracts';
import { useFreelancerProposals, RecentProposalView } from './use-freelancer-proposals';
import { useFreelancerRecommendations, RecommendedProjectView } from './use-freelancer-recommendations';

export type { ActiveContractView, RecentProposalView, RecommendedProjectView };

export function useFreelancerDashboard() {
  const currentUser = useUser();
  const { isPro } = usePlan();

  const contracts = useFreelancerContracts(currentUser?.id ?? '');
  const proposals = useFreelancerProposals(currentUser?.id ?? '');
  const recommendations = useFreelancerRecommendations(currentUser?.id ?? '', isPro);

  const [coreLoading, setCoreLoading] = useState(true);
  const [range, setRange] = useState<RangePresetId>(DEFAULT_RANGE_PRESET);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [reloadKey, setReloadKey] = useState(0);

  const analyticsRange = useMemo(() => resolveRange(range, new Date()), [range]);
  const { data: analytics } = useFreelancerAnalytics(analyticsRange, Boolean(currentUser));
  const totalEarnings = analytics?.totalEarnings ?? null;
  const projectsCompleted = analytics?.projectsCompleted ?? null;

  const loadReputation = useCallback(async () => {
    if (!currentUser) return;
    try {
      const reputationRes = await reputationApi.getScore(currentUser.id);
      setAverageRating(reputationRes.data.averageRating);
      setTotalRatings(reputationRes.data.totalRatings);
    } catch (error) {
      reportLoadFailure(error, 'reputation data', () => setReloadKey((prev) => prev + 1));
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    let mounted = true;

    async function run() {
      if (!mounted) return;
      await loadReputation();
    }

    run().catch(console.error);

    return () => {
      mounted = false;
    };
  }, [currentUser, loadReputation, reloadKey]);

  useEffect(() => {
    if (contracts.loading || proposals.loading) return;
    const timer = requestAnimationFrame(() => setCoreLoading(false));
    return () => cancelAnimationFrame(timer);
  }, [contracts.loading, proposals.loading]);

  const reloadCore = useCallback(() => {
    setReloadKey((prev) => prev + 1);
    void contracts.refresh();
    void proposals.refresh();
    void recommendations.refresh();
    void loadReputation();
  }, [contracts, proposals, recommendations, loadReputation]);

  const hasData = contracts.activeContracts.length > 0 || proposals.recentProposals.length > 0;

  return {
    currentUser,
    coreLoading: coreLoading || contracts.loading || proposals.loading,
    recommendedLoading: recommendations.loading,
    range,
    setRange,
    averageRating,
    totalRatings,
    activeContracts: contracts.activeContracts,
    pendingProposalCount: proposals.pendingProposalCount,
    recentProposals: proposals.recentProposals,
    pendingProposals: proposals.pendingProposals,
    acceptedProposals: proposals.acceptedProposals,
    rejectedProposals: proposals.rejectedProposals,
    recommended: recommendations.recommendations,
    totalEarnings,
    projectsCompleted,
    isPro,
    hasData,
    reloadCore,
    refreshContracts: contracts.refresh,
    refreshProposals: proposals.refresh,
    refreshRecommendations: recommendations.refresh,
  };
}
