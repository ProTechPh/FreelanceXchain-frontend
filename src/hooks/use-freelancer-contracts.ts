'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Contract } from '@/types';
import { contractsApi, projectsApi } from '@/lib/api';

export interface ActiveContractView {
  contract: Contract;
  project: import('@/types').Project | null;
}

export interface FreelancerContractsData {
  activeContracts: ActiveContractView[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useFreelancerContracts(freelancerId: string): FreelancerContractsData {
  const [activeContracts, setActiveContracts] = useState<ActiveContractView[]>([]);
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

      const contractsRes = await contractsApi.list();

      const activeContractsList: Contract[] = contractsRes.data.items.filter(
        (c: Contract) => c.status === 'active'
      );

      const projectIdsToFetch = new Set<string>();
      activeContractsList.forEach((c) => projectIdsToFetch.add(c.projectId));

      setActiveContracts(
        activeContractsList.map((contract) => ({
          contract,
          project: projectCacheRef.current.get(contract.projectId) ?? null,
        }))
      );

      if (projectIdsToFetch.size > 0) {
        const projectMap = await fetchProjectDetails(Array.from(projectIdsToFetch));
        setActiveContracts(
          activeContractsList.map((contract) => ({
            contract,
            project: projectMap.get(contract.projectId) ?? null,
          }))
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load contracts';
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
    activeContracts,
    loading,
    error,
    refresh,
  };
}
