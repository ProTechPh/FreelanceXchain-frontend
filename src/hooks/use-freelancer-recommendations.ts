'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { matchingApi, projectsApi } from '@/lib/api';

export interface ProjectRecommendation {
  projectId: string;
  matchScore: number;
  matchedSkills: string[];
}

export interface RecommendedProjectView {
  project: import('@/types').Project;
  matchScore: number;
  matchedSkills: string[];
}

export interface FreelancerRecommendationsData {
  recommendations: RecommendedProjectView[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useFreelancerRecommendations(freelancerId: string, isPro: boolean): FreelancerRecommendationsData {
  const [recommendations, setRecommendations] = useState<RecommendedProjectView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectCacheRef = useRef<Map<string, import('@/types').Project | null>>(new Map());

  const fetchProjectDetails = useCallback(async (projectIds: string[]): Promise<Map<string, import('@/types').Project | null>> => {
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

  const load = useCallback(async () => {
    if (!freelancerId || !isPro) {
      setLoading(false);
      setRecommendations([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const recommendationsRes = await matchingApi.getProjectRecommendations(3);

      const recsList = recommendationsRes.data || [];
      const recProjectIds = recsList.map((r: ProjectRecommendation) => r.projectId);
      const projectMap = await fetchProjectDetails(recProjectIds);

      setRecommendations(
        recsList
          .map((r: ProjectRecommendation) => ({
            project: projectMap.get(r.projectId) ?? null,
            matchScore: r.matchScore,
            matchedSkills: r.matchedSkills,
          }))
          .filter((r): r is RecommendedProjectView => r.project !== null)
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load recommendations';
      setError(message);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [freelancerId, isPro, fetchProjectDetails]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!mounted) return;
      await load();
    }

    run().catch(console.error);

    return () => {
      mounted = false;
    };
  }, [load]);

  return {
    recommendations,
    loading,
    error,
    refresh,
  };
}
