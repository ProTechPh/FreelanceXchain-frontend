'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ProjectDetailView } from '@/components/projects/project-detail-view';
import { DetailSkeleton } from '@/components/dashboard/skeletons';

function FreelancerProjectDetailContent() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? '';

  return (
    <ProjectDetailView
      projectId={projectId}
      mode="dashboard"
      defaultBackHref="/dashboard/freelancer/projects"
      defaultBackLabel="Back to projects"
    />
  );
}

export default function FreelancerProjectDetailPage() {
  return (
    <Suspense fallback={<DetailSkeleton label="Loading project" />}>
      <FreelancerProjectDetailContent />
    </Suspense>
  );
}
