'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { projectsApi, freelancersApi, reputationApi, matchingApi, type FreelancerRecommendation } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useEmployerAnalytics } from '@/hooks/use-analytics';
import { usePlan } from '@/hooks/use-plan';
import { DEFAULT_RANGE_PRESET, resolveRange, type RangePresetId } from '@/lib/analytics-range';
import type { Project, Proposal } from '@/types';
import { reportLoadFailure } from '@/lib/report-failure';

export interface RecentProposalView {
  proposal: Proposal;
  projectTitle: string;
  freelancerName: string;
  rating: number | null;
  projectId: string;
}

export interface RecommendedFreelancerView {
  freelancerId: string;
  name: string;
  matchScore: number;
  matchedSkills: string[];
  rating: number | null;
  totalRatings: number;
}

export function useEmployerDashboard() {
  const currentUser = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [coreLoading, setCoreLoading] = useState(true);
  const [range, setRange] = useState<RangePresetId>(DEFAULT_RANGE_PRESET);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingProposalCount, setPendingProposalCount] = useState(0);
  const [recentProposals, setRecentProposals] = useState<RecentProposalView[]>([]);
  const [recommended, setRecommended] = useState<RecommendedFreelancerView[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(true);

  const analyticsRange = useMemo(() => resolveRange(range, new Date()), [range]);
  const { isPro } = usePlan();
  const { data: analytics } = useEmployerAnalytics(analyticsRange, Boolean(currentUser) && isPro);
  const totalSpent = analytics?.totalSpent ?? null;
  const completedContractCount = analytics?.projectsCompleted ?? null;

  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  const load = useCallback(async () => {
    if (!currentUser) return;

    try {
      const [projectsRes] = await Promise.allSettled([projectsApi.getMyProjects()]);

      let myProjects: Project[] = [];
      if (projectsRes.status === 'fulfilled') {
        myProjects = projectsRes.value.data.items;
        setProjects(myProjects);
      }

      setCoreLoading(false);
      setLoading(false);

      const openOrActive = myProjects
        .filter((p) => p.status === 'open' || p.status === 'in_progress')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);

      if (openOrActive.length === 0) return;

      const proposalLists = await Promise.all(
        openOrActive.map((p) => projectsApi.getProposals(p.id).then((r) => r.data.items).catch(() => []))
      );

      const allProposals = openOrActive.flatMap((project, i) =>
        proposalLists[i].map((proposal) => ({ proposal, project }))
      );
      setPendingProposalCount(allProposals.filter((p) => p.proposal.status === 'pending').length);

      const recent = allProposals
        .sort((a, b) => new Date(b.proposal.createdAt).getTime() - new Date(a.proposal.createdAt).getTime())
        .slice(0, 5);

      type FreelancerProfileResult = Awaited<ReturnType<typeof freelancersApi.getPublicProfile>>;
      type ReputationScoreResult = Awaited<ReturnType<typeof reputationApi.getScore>>;
      type FreelancerData = {
        profile: FreelancerProfileResult | null;
        score: ReputationScoreResult | null;
      };

      const profileScoreCache = new Map<string, Promise<FreelancerData>>();
      const getFreelancerData = (id: string): Promise<FreelancerData> => {
        const cached = profileScoreCache.get(id);
        if (cached) return cached;

        const promise = Promise.all([
          freelancersApi.getPublicProfile(id).catch(() => null),
          reputationApi.getScore(id).catch(() => null),
        ]).then(([profile, score]) => ({ profile, score }));

        profileScoreCache.set(id, promise);
        return promise;
      };

      const details = await Promise.all(
        recent.map(async ({ proposal }) => getFreelancerData(proposal.freelancerId))
      );

      setRecentProposals(
        recent.map(({ proposal, project }, i) => ({
          proposal,
          projectTitle: project.title,
          freelancerName: details[i]?.profile?.data.name ?? 'Freelancer',
          rating: details[i]?.score?.data.averageRating ?? null,
          projectId: project.id,
        }))
      );

      // Load AI recommended freelancers in background
      if (!isPro) {
        setRecommendedLoading(false);
        return;
      }
      try {
        setRecommendedLoading(true);
        const openProjectIds = openOrActive.map((p) => p.id);
        const recsResults = await Promise.allSettled(
          openProjectIds.slice(0, 2).map((id) =>
            matchingApi.getFreelancerRecommendations(id, 3).then((r) => r.data)
          )
        );
        const allRecs = recsResults
          .filter((r): r is PromiseFulfilledResult<FreelancerRecommendation[]> => r.status === 'fulfilled')
          .flatMap((r) => r.value);

        const seen = new Map<string, FreelancerRecommendation>();
        for (const rec of allRecs) {
          const existing = seen.get(rec.freelancerId);
          if (!existing || rec.matchScore > existing.matchScore) {
            seen.set(rec.freelancerId, rec);
          }
        }
        const uniqueRecs = Array.from(seen.values())
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 3);

        if (uniqueRecs.length > 0) {
          const profiles = await Promise.all(
            uniqueRecs.map(async (rec) => getFreelancerData(rec.freelancerId))
          );
          setRecommended(
            uniqueRecs.map((rec, i) => ({
              freelancerId: rec.freelancerId,
              name: profiles[i]?.profile?.data.name ?? 'Freelancer',
              matchScore: rec.matchScore,
              matchedSkills: rec.matchedSkills,
              rating: profiles[i]?.score?.data.averageRating ?? null,
              totalRatings: profiles[i]?.score?.data.totalRatings ?? 0,
            }))
          );
        }
      } catch {
        // Recommendations are a background enhancement; degrade gracefully
      } finally {
        setRecommendedLoading(false);
      }
    } catch (error) {
      reportLoadFailure(error, 'your dashboard', reload);
    } finally {
      setCoreLoading(false);
      setLoading(false);
    }
  }, [currentUser, isPro, reload]);

  useEffect(() => {
    if (!currentUser) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [currentUser, isPro, load, reloadKey]);

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status === 'open' || p.status === 'in_progress'),
    [projects]
  );

  return {
    currentUser,
    loading,
    coreLoading,
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
    reload: load,
  };
}
