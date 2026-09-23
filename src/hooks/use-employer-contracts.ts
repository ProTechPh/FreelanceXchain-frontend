'use client';

import { useState, useEffect, useCallback } from 'react';
import { matchingApi, freelancersApi, reputationApi, type FreelancerRecommendation } from '@/lib/api';
import { useUser } from '@/stores/authStore';
import { usePlan } from '@/hooks/use-plan';
import type { Project } from '@/types';

export interface RecommendedFreelancerView {
  freelancerId: string;
  name: string;
  matchScore: number;
  matchedSkills: string[];
  rating: number | null;
  totalRatings: number;
}

export interface EmployerContractsData {
  recommended: RecommendedFreelancerView[];
  recommendedLoading: boolean;
  reloadContracts: () => void;
}

export function useEmployerContracts(
  activeProjects: Project[],
  activeProjectsLoading: boolean
): EmployerContractsData {
  const currentUser = useUser();
  const { isPro } = usePlan();
  const [recommended, setRecommended] = useState<RecommendedFreelancerView[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    type FreelancerProfileResult = Awaited<ReturnType<typeof freelancersApi.getPublicProfile>>;
    type ReputationScoreResult = Awaited<ReturnType<typeof reputationApi.getScore>>;
    type FreelancerData = {
      profile: FreelancerProfileResult | null;
      score: ReputationScoreResult | null;
    };

    const loadRecommendations = async () => {
      if (!currentUser || activeProjectsLoading || !isPro || activeProjects.length === 0) {
        setRecommended([]);
        setRecommendedLoading(false);
        return;
      }

      try {
        setRecommendedLoading(true);

        const openOrActive = activeProjects
          .filter((p) => p.status === 'open' || p.status === 'in_progress')
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5);

        const openProjectIds = openOrActive.map((p) => p.id);

        if (openProjectIds.length === 0) {
          if (!cancelled) {
            setRecommended([]);
          }
          return;
        }

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

        if (uniqueRecs.length === 0) {
          if (!cancelled) {
            setRecommended([]);
          }
          return;
        }

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

        const profiles = await Promise.all(
          uniqueRecs.map(async (rec) => getFreelancerData(rec.freelancerId))
        );

        if (!cancelled) {
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
        if (!cancelled) {
          setRecommended([]);
        }
      } finally {
        if (!cancelled) {
          setRecommendedLoading(false);
        }
      }
    };

    void loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [currentUser, activeProjects, activeProjectsLoading, isPro, reloadKey, reload]);

  return {
    recommended,
    recommendedLoading,
    reloadContracts: reload,
  };
}
