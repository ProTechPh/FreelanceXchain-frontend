'use client';

import { useState, useEffect, useCallback } from 'react';
import { projectsApi, freelancersApi, reputationApi } from '@/lib/api';
import { useUser } from '@/stores/authStore';
import { reportLoadFailure } from '@/lib/report-failure';
import type { Proposal, Project } from '@/types';

export interface RecentProposalView {
  proposal: Proposal;
  projectTitle: string;
  freelancerName: string;
  rating: number | null;
  projectId: string;
}

export interface EmployerProposalsData {
  pendingProposalCount: number;
  recentProposals: RecentProposalView[];
  proposalsLoading: boolean;
  reloadProposals: () => void;
}

export function useEmployerProposals(
  activeProjects: Project[],
  activeProjectsLoading: boolean
): EmployerProposalsData {
  const currentUser = useUser();
  const [pendingProposalCount, setPendingProposalCount] = useState(0);
  const [recentProposals, setRecentProposals] = useState<RecentProposalView[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);
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

    const loadProposals = async () => {
      if (!currentUser || activeProjectsLoading) {
        return;
      }

      if (activeProjects.length === 0) {
        if (!cancelled) {
          setPendingProposalCount((prev) => (prev === 0 ? prev : 0));
          setRecentProposals((prev) => (prev.length === 0 ? prev : []));
          setProposalsLoading((prev) => (!prev ? prev : false));
        }
        return;
      }

      try {
        setProposalsLoading(true);

        const openOrActive = activeProjects
          .filter((p) => p.status === 'open' || p.status === 'in_progress')
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5);

        if (openOrActive.length === 0) {
          if (!cancelled) {
            setPendingProposalCount((prev) => (prev === 0 ? prev : 0));
            setRecentProposals((prev) => (prev.length === 0 ? prev : []));
            setProposalsLoading((prev) => (!prev ? prev : false));
          }
          return;
        }

        const proposalLists = await Promise.all(
          openOrActive.map((p) =>
            projectsApi.getProposals(p.id).then((r) => r.data.items).catch(() => [])
          )
        );

        const allProposals = openOrActive.flatMap((project, i) =>
          proposalLists[i].map((proposal) => ({ proposal, project }))
        );

        if (!cancelled) {
          setPendingProposalCount(
            allProposals.filter((p) => p.proposal.status === 'pending').length
          );
        }

        const recent = allProposals
          .sort((a, b) => new Date(b.proposal.createdAt).getTime() - new Date(a.proposal.createdAt).getTime())
          .slice(0, 5);

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

        if (!cancelled) {
          setRecentProposals(
            recent.map(({ proposal, project }, i) => ({
              proposal,
              projectTitle: project.title,
              freelancerName: details[i]?.profile?.data.name ?? 'Freelancer',
              rating: details[i]?.score?.data.averageRating ?? null,
              projectId: project.id,
            }))
          );
        }
      } catch (error) {
        if (!cancelled) {
          reportLoadFailure(error, 'load proposals', reload);
        }
      } finally {
        if (!cancelled) {
          setProposalsLoading(false);
        }
      }
    };

    void loadProposals();

    return () => {
      cancelled = true;
    };
  }, [currentUser, activeProjects, activeProjectsLoading, reloadKey, reload]);

  return {
    pendingProposalCount,
    recentProposals,
    proposalsLoading,
    reloadProposals: reload,
  };
}
