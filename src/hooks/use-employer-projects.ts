'use client';

import { useState, useEffect, useCallback } from 'react';
import { projectsApi } from '@/lib/api';
import { useUser } from '@/stores/authStore';
import { reportLoadFailure } from '@/lib/report-failure';
import type { Project } from '@/types';

export interface EmployerProjectsData {
  projects: Project[];
  activeProjects: Project[];
  projectsLoading: boolean;
  reloadProjects: () => void;
}

export function useEmployerProjects(): EmployerProjectsData {
  const currentUser = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      if (!currentUser) {
        setProjects([]);
        setProjectsLoading(false);
        return;
      }

      try {
        setProjectsLoading(true);
        const res = await projectsApi.getMyProjects();
        if (!cancelled) {
          setProjects(res.data.items);
        }
      } catch (error) {
        if (!cancelled) {
          reportLoadFailure(error, 'load projects', reload);
        }
      } finally {
        if (!cancelled) {
          setProjectsLoading(false);
        }
      }
    };

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [currentUser, reloadKey, reload]);

  const activeProjects = projects.filter(
    (p) => p.status === 'open' || p.status === 'in_progress'
  );

  return {
    projects,
    activeProjects,
    projectsLoading,
    reloadProjects: reload,
  };
}
