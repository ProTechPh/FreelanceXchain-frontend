'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Clock, DollarSign, Users, Zap } from 'lucide-react';
import { MarketplaceBrowser } from '@/components/marketplace/marketplace-browser';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Project } from '@/types';

function ProjectResult({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card className="cursor-pointer transition-all hover:border-primary/30 hover:glow-sm-primary">
        <CardContent className="p-6 pr-16">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold transition-colors hover:text-primary">{project.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{project.employer?.name || 'Unknown Employer'}</p>
            </div>
            {project.isRush && <Badge className="bg-amber-500/10 text-amber-500"><Zap className="mr-1 size-3" />Rush +{project.rushFeePercentage}%</Badge>}
          </div>
          <p className="mb-4 line-clamp-2 text-muted-foreground">{project.description}</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {project.requiredSkills?.map((skill) => <Badge key={skill.skillId ?? skill.skillName} variant="secondary">{skill.skillName}</Badge>)}
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 font-medium text-primary"><DollarSign className="size-4" />${project.budget.toLocaleString()}</span>
            <span className="flex items-center gap-1"><Clock className="size-4" />{new Date(project.deadline).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><Users className="size-4" />{project.proposalCount || 0} proposals</span>
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProjectsMarketplace() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams?.get('keyword') || '';

  return (
    <MarketplaceBrowser<Project>
      key={initialKeyword}
      kind="project"
      initialKeyword={initialKeyword}
      title="Browse Projects"
      description="Search open work by keyword, skill, and budget, then save the searches you care about."
      emptyMessage="No open projects match these filters."
      layout="list"
      renderItem={(project) => <ProjectResult project={project} />}
    />
  );
}

export default function ProjectsPage() {
  return <Suspense><ProjectsMarketplace /></Suspense>;
}
