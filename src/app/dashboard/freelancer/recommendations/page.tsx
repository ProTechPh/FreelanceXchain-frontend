'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, FolderSearch, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { matchingApi, projectsApi, type ProjectRecommendation } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import type { Project } from '@/types';

interface RecommendationView extends ProjectRecommendation {
  project: Project;
}

export default function FreelancerRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendationView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data } = await matchingApi.getProjectRecommendations(50);
        const projects = await Promise.all(data.map((item) => projectsApi.get(item.projectId).then((response) => response.data).catch(() => null)));
        if (active) {
          setRecommendations(data.map((item, index) => ({ ...item, project: projects[index] })).filter((item): item is RecommendationView => item.project !== null));
        }
      } catch (error) {
        if (active) toast.error(getApiErrorMessage(error, 'Unable to load project recommendations.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold"><Sparkles className="h-6 w-6 text-primary" />Recommended Projects</h1><p className="mt-1 text-muted-foreground">AI-ranked opportunities based on your profile skills and reputation.</p></div>
      {loading ? <div className="flex h-64 items-center justify-center" aria-label="Loading recommendations"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> : recommendations.length === 0 ? <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center"><FolderSearch className="h-10 w-10 text-muted-foreground" /><div><p className="font-medium">No recommendations yet</p><p className="mt-1 text-sm text-muted-foreground">Add more skills to your profile or browse all open projects.</p></div><Button asChild variant="outline"><Link href="/dashboard/freelancer/projects">Browse projects</Link></Button></CardContent></Card> : <div className="grid gap-4 lg:grid-cols-2">{recommendations.map((item) => <Card key={item.projectId}><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>{item.project.title}</CardTitle><p className="mt-1 text-sm text-muted-foreground">${item.project.budget.toLocaleString()} · due {new Date(item.project.deadline).toLocaleDateString()}</p></div><Badge className="bg-green-500/10 text-green-500">{Math.round(item.matchScore)}% match</Badge></div></CardHeader><CardContent className="space-y-4"><p className="line-clamp-2 text-sm text-muted-foreground">{item.project.description}</p><div><p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Matched skills</p><div className="flex flex-wrap gap-2">{item.matchedSkills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div></div>{item.missingSkills.length > 0 && <p className="text-xs text-muted-foreground">Potential gaps: {item.missingSkills.join(', ')}</p>}<p className="rounded-lg bg-secondary/40 p-3 text-sm text-muted-foreground">{item.reasoning}</p><Button asChild><Link href={`/projects/${item.project.id}`}>View project<ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button></CardContent></Card>)}</div>}
    </div>
  );
}
