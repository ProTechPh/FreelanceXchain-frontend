'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Bookmark, Sparkles } from 'lucide-react';

import { MarketplaceBrowser } from '@/components/marketplace/marketplace-browser';
import { ProjectListItem } from '@/components/marketplace/project-list-item';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { matchingApi } from '@/lib/api';
import { marketplaceFiltersFromSearchParams } from '@/lib/marketplace-search';
import type { Project } from '@/types';

interface MatchInfo {
  matchScore: number;
  matchedSkills: string[];
}

/**
 * Skill match lives on the recommendations endpoint, not on search results, so
 * it is fetched once and overlaid onto whichever browse results it covers.
 * Rows with no recommendation simply omit the score rather than showing a
 * fabricated one, and a failed lookup degrades to a plain list.
 */
function useProjectMatches() {
  const [matches, setMatches] = useState<Record<string, MatchInfo>>({});

  useEffect(() => {
    let active = true;
    void matchingApi
      .getProjectRecommendations(50)
      .then(({ data }) => {
        if (!active) return;
        const next: Record<string, MatchInfo> = {};
        for (const item of data ?? []) {
          next[item.projectId] = { matchScore: item.matchScore, matchedSkills: item.matchedSkills ?? [] };
        }
        setMatches(next);
      })
      .catch(() => {
        // Match scores are an enhancement; browsing must work without them.
      });
    return () => {
      active = false;
    };
  }, []);

  return matches;
}

function FreelancerProjectBrowser() {
  const matches = useProjectMatches();
  const searchParams = useSearchParams();
  const serializedFilters = searchParams?.toString() ?? '';
  const initialFilters = marketplaceFiltersFromSearchParams(new URLSearchParams(serializedFilters));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Browse projects"
        description="Search open projects, filter by skill and budget, and save the searches you want to come back to."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/freelancer/saved">
                <Bookmark className="size-4" aria-hidden="true" />
                Saved
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard/freelancer/recommendations">
                <Sparkles className="size-4" aria-hidden="true" />
                Recommended for you
              </Link>
            </Button>
          </>
        }
      />

      <MarketplaceBrowser<Project>
        key={serializedFilters}
        kind="project"
        variant="dashboard"
        initialFilters={initialFilters}
        emptyMessage="No open projects match these filters."
        layout="list"
        renderItem={(project, listingQuery) => (
          <ProjectListItem
            project={project}
            returnTo={`/dashboard/freelancer/projects${listingQuery ? `?${listingQuery}` : ''}`}
            matchScore={matches[project.id]?.matchScore}
            matchedSkills={matches[project.id]?.matchedSkills}
          />
        )}
      />
    </div>
  );
}

export default function FreelancerProjectsPage() {
  return (
    <Suspense>
      <FreelancerProjectBrowser />
    </Suspense>
  );
}
