'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  contractsApi,
  proposalsApi,
  matchingApi,
  projectsApi,
  reputationApi,
} from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useFreelancerAnalytics } from '@/hooks/use-analytics';
import { DEFAULT_RANGE_PRESET, resolveRange, type RangePresetId } from '@/lib/analytics-range';
import type { Contract, Proposal, Project } from '@/types';
import { reportLoadFailure } from '@/lib/report-failure';
import { usePlan } from '@/hooks/use-plan';

export interface ActiveContractView {
  contract: Contract;
  project: Project | null;
}

export interface RecentProposalView {
  proposal: Proposal;
  project: Project | null;
}

export interface RecommendedProjectView {
  project: Project;
  matchScore: number;
  matchedSkills: string[];
}

export function useFreelancerDashboard() {
  const currentUser = useAuthStore((state) => state.user);
  const [coreLoading, setCoreLoading] = useState(true);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [range, setRange] = useState<RangePresetId>(DEFAULT_RANGE_PRESET);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [activeContracts, setActiveContracts] = useState<ActiveContractView[]>([]);
  const [pendingProposalCount, setPendingProposalCount] = useState(0);
  const [recentProposals, setRecentProposals] = useState<RecentProposalView[]>([]);
  const [recommended, setRecommended] = useState<RecommendedProjectView[]>([]);

  const projectCacheRef = useRef<Map<string, Project | null>>(new Map());

  const fetchProjectDetails = useCallback(async (projectIds: string[]): Promise<Map<string, Project | null>> => {
    const missing = projectIds.filter((id) => !projectCacheRef.current.has(id));
    if (missing.length > 0) {
      await Promise.all(
        missing.map(async (id) => {
          try {
            const res = await projectsApi.get(id);
            projectCacheRef.current.set(id, res.data);
          } catch {
            projectCacheRef.current.set(id, null);
          }
        })
      );
    }
    return projectCacheRef.current;
  }, []);

  const analyticsRange = useMemo(() => resolveRange(range, new Date()), [range]);
  const { isPro } = usePlan();
  const { data: analytics } = useFreelancerAnalytics(analyticsRange, Boolean(currentUser));
  const totalEarnings = analytics?.totalEarnings ?? null;
  const projectsCompleted = analytics?.projectsCompleted ?? null;

  const [reloadKey, setReloadKey] = useState(0);
  const reloadCore = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  const loadCore = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [contractsRes, proposalsRes, reputationRes] = await Promise.allSettled([
        contractsApi.list(),
        proposalsApi.getMine(),
        reputationApi.getScore(currentUser.id),
      ]);

      if (reputationRes.status === 'fulfilled') {
        setAverageRating(reputationRes.value.data.averageRating);
        setTotalRatings(reputationRes.value.data.totalRatings);
      }

      const projectIdsToFetch = new Set<string>();

      let activeContractsList: Contract[] = [];
      if (contractsRes.status === 'fulfilled') {
        activeContractsList = contractsRes.value.data.items.filter((c) => c.status === 'active');
        activeContractsList.forEach((c) => projectIdsToFetch.add(c.projectId));
      }

      let recentProposalsList: Proposal[] = [];
      if (proposalsRes.status === 'fulfilled') {
        const all = proposalsRes.value.data;
        setPendingProposalCount(all.filter((p) => p.status === 'pending').length);

        recentProposalsList = all
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        recentProposalsList.forEach((p) => projectIdsToFetch.add(p.projectId));
      }

      setActiveContracts(
        activeContractsList.map((contract) => ({
          contract,
          project: projectCacheRef.current.get(contract.projectId) ?? null,
        }))
      );

      setRecentProposals(
        recentProposalsList.map((proposal) => ({
          proposal,
          project: projectCacheRef.current.get(proposal.projectId) ?? null,
        }))
      );

      setCoreLoading(false);

      if (projectIdsToFetch.size > 0) {
        const projectMap = await fetchProjectDetails(Array.from(projectIdsToFetch));

        setActiveContracts(
          activeContractsList.map((contract) => ({
            contract,
            project: projectMap.get(contract.projectId) ?? null,
          }))
        );

        setRecentProposals(
          recentProposalsList.map((proposal) => ({
            proposal,
            project: projectMap.get(proposal.projectId) ?? null,
          }))
        );
      }
    } catch (error) {
      reportLoadFailure(error, 'your dashboard', reloadCore);
    } finally {
      setCoreLoading(false);
    }
  }, [currentUser, fetchProjectDetails, reloadCore]);

  const loadRecommendations = useCallback(async () => {
    if (!isPro) {
      setRecommendedLoading(false);
      return;
    }
    try {
      setRecommendedLoading(true);
      const recommendationsRes = await matchingApi.getProjectRecommendations(3);

      const recsList = recommendationsRes.data || [];
      const recProjectIds = recsList.map((r) => r.projectId);
      const projectMap = await fetchProjectDetails(recProjectIds);

      setRecommended(
        recsList
          .map((r) => ({
            project: projectMap.get(r.projectId) ?? null,
            matchScore: r.matchScore,
            matchedSkills: r.matchedSkills,
          }))
          .filter((r): r is RecommendedProjectView => r.project !== null)
      );
    } catch {
      setRecommended([]);
    } finally {
      setRecommendedLoading(false);
    }
  }, [isPro, fetchProjectDetails]);

  useEffect(() => {
    if (!currentUser) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCore();
    void loadRecommendations();
  }, [currentUser, isPro, loadCore, loadRecommendations, reloadKey]);

  const hasData = activeContracts.length > 0 || recentProposals.length > 0;

  return {
    currentUser,
    coreLoading,
    recommendedLoading,
    range,
    setRange,
    averageRating,
    totalRatings,
    activeContracts,
    pendingProposalCount,
    recentProposals,
    recommended,
    totalEarnings,
    projectsCompleted,
    isPro,
    hasData,
    reloadCore: loadCore,
  };
}
