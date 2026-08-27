'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, FolderSearch, Sparkles, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { matchingApi, projectsApi, type ProjectRecommendation } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import type { Project } from '@/types';
import { CardGridSkeleton } from '@/components/dashboard/skeletons';

interface RecommendationView extends ProjectRecommendation {
  project: Project;
}

export default function FreelancerRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileNotFound, setProfileNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data } = await matchingApi.getProjectRecommendations(50);
        const projects = await Promise.all(
          data.map((item) =>
            projectsApi
              .get(item.projectId)
              .then((response) => response.data)
              .catch(() => null),
          ),
        );
        if (active) {
          setRecommendations(
            data
              .map((item, index) => ({ ...item, project: projects[index] }))
              .filter((item): item is RecommendationView => item.project !== null),
          );
        }
      } catch (error: unknown) {
        const errorMessage = getApiErrorMessage(error, '');
        if (errorMessage.toLowerCase().includes('profile not found') || errorMessage.toLowerCase().includes('not found')) {
          if (active) setProfileNotFound(true);
        } else {
          if (active) toast.error(errorMessage || 'Unable to load project recommendations.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="h-6 w-6 text-primary" />
          Recommended Projects
        </h1>
        <p className="mt-1 text-muted-foreground">
          AI-ranked opportunities based on your profile skills and reputation.
        </p>
      </div>

      {loading ? (
        <CardGridSkeleton count={6} label="Loading recommendations" />
      ) : recommendations.length === 0 ? (
        <Card className="rounded-2xl border-border bg-card">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center max-w-lg mx-auto">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {profileNotFound ? (
                <UserCheck className="size-6 text-primary" />
              ) : (
                <FolderSearch className="size-6 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1.5">
              <p className="text-lg font-bold text-foreground">
                {profileNotFound ? 'Complete your profile for AI recommendations' : 'No recommendations yet'}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {profileNotFound
                  ? 'Our AI engine matches open projects with the skills in your profile. Add your skills, bio, and hourly rate to start receiving personalized recommendations.'
                  : 'We couldn’t find any open projects matching your current profile skills. Add more skills to your profile or browse all available projects.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild variant="gradient">
                <Link href="/dashboard/freelancer/profile">
                  {profileNotFound ? 'Set up Profile & Skills →' : 'Update Profile Skills'}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/freelancer/projects">Browse All Projects</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {recommendations.map((item) => (
            <Card key={item.projectId} className="rounded-2xl border-border bg-card">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {item.project.title}
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      ${item.project.budget.toLocaleString()} USDC · due{' '}
                      {new Date(item.project.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-success-subtle text-success shrink-0">
                    {Math.round(item.matchScore)}% match
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {item.project.description}
                </p>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Matched skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.matchedSkills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                {item.missingSkills.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Potential gaps: {item.missingSkills.join(', ')}
                  </p>
                )}
                <p className="rounded-lg bg-secondary/40 p-3 text-sm text-muted-foreground">
                  {item.reasoning}
                </p>
                <Button asChild>
                  <Link href={`/dashboard/freelancer/projects/${item.project.id}`}>
                    View project
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
