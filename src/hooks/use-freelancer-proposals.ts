'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Proposal } from '@/types';
import { proposalsApi, projectsApi } from '@/lib/api';

export interface RecentProposalView {
  proposal: Proposal;
  project: import('@/types').Project | null;
}

export interface FreelancerProposalsData {
  pendingProposals: Proposal[];
  acceptedProposals: Proposal[];
  rejectedProposals: Proposal[];
  pendingProposalCount: number;
  recentProposals: RecentProposalView[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useFreelancerProposals(freelancerId: string): FreelancerProposalsData {
  const [pendingProposals, setPendingProposals] = useState<Proposal[]>([]);
  const [acceptedProposals, setAcceptedProposals] = useState<Proposal[]>([]);
  const [rejectedProposals, setRejectedProposals] = useState<Proposal[]>([]);
  const [pendingProposalCount, setPendingProposalCount] = useState(0);
  const [recentProposals, setRecentProposals] = useState<RecentProposalView[]>([]);
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
    if (!freelancerId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const proposalsRes = await proposalsApi.getMine();
      const all: Proposal[] = proposalsRes.data;

      const pending = all.filter((p) => p.status === 'pending');
      const accepted = all.filter((p) => p.status === 'accepted');
      const rejected = all.filter((p) => p.status === 'rejected');

      setPendingProposals(pending);
      setAcceptedProposals(accepted);
      setRejectedProposals(rejected);
      setPendingProposalCount(pending.length);

      const recentProposalsList = all
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      const projectIdsToFetch = new Set<string>();
      recentProposalsList.forEach((p) => projectIdsToFetch.add(p.projectId));

      setRecentProposals(
        recentProposalsList.map((proposal) => ({
          proposal,
          project: projectCacheRef.current.get(proposal.projectId) ?? null,
        }))
      );

      if (projectIdsToFetch.size > 0) {
        const projectMap = await fetchProjectDetails(Array.from(projectIdsToFetch));
        setRecentProposals(
          recentProposalsList.map((proposal) => ({
            proposal,
            project: projectMap.get(proposal.projectId) ?? null,
          }))
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load proposals';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [freelancerId, fetchProjectDetails]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    pendingProposals,
    acceptedProposals,
    rejectedProposals,
    pendingProposalCount,
    recentProposals,
    loading,
    error,
    refresh,
  };
}
