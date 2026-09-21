'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { proposalsApi } from '@/lib/api';
import { qk, STALE_TIME } from '@/lib/query-keys';
import { useAuthStore } from '@/stores/authStore';
import type { Proposal, ProposalStatus } from '@/types';

/**
 * `/proposals/freelancer/me` returns a bare array today, but several list
 * endpoints in this API return `{ items }`. Accept both so a future pagination
 * change does not silently blank the indicator.
 */
function toProposalList(data: unknown): Proposal[] {
  if (Array.isArray(data)) return data as Proposal[];
  const items = (data as { items?: unknown } | null)?.items;
  return Array.isArray(items) ? (items as Proposal[]) : [];
}

function proposalProjectId(proposal: Proposal): string | undefined {
  if (proposal.projectId) return proposal.projectId;
  return typeof proposal.project === 'object' ? proposal.project?.id : undefined;
}

/**
 * The signed-in freelancer's own proposals.
 *
 * Only freelancers may call the endpoint (`requireRole('freelancer')`), so the
 * query stays disabled for everyone else rather than generating a 403 on every
 * dashboard mount.
 */
export function useMyProposals() {
  const user = useAuthStore((state) => state.user);
  const enabled = user?.role === 'freelancer';

  return useQuery({
    queryKey: qk.myProposals(),
    queryFn: async () => toProposalList((await proposalsApi.getMine()).data),
    staleTime: STALE_TIME.short,
    enabled,
  });
}

/**
 * Lookup of project id → the freelancer's live proposal status, for marking
 * rows they have already bid on.
 *
 * Withdrawn proposals are left out on purpose: the API's duplicate guard
 * (`getExistingProposal`) ignores them too, so those projects really are open
 * to bid on again and must not read as taken.
 *
 * A failed lookup yields an empty map, so browsing degrades to an unmarked list
 * rather than an error.
 */
export function useMyProposalStatusByProject(): Map<string, ProposalStatus> {
  const { data } = useMyProposals();

  return useMemo(() => {
    const byProject = new Map<string, ProposalStatus>();
    for (const proposal of data ?? []) {
      if (proposal.status === 'withdrawn') continue;
      const projectId = proposalProjectId(proposal);
      if (projectId) byProject.set(projectId, proposal.status);
    }
    return byProject;
  }, [data]);
}

/**
 * Refreshes the lookup after the freelancer submits or withdraws a proposal,
 * so the browse list stops showing a stale "not yet applied" row.
 */
export function useInvalidateMyProposals() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: qk.myProposals() });
  }, [queryClient]);
}
