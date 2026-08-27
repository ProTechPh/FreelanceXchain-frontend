'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ProjectDetailView } from '@/components/projects/project-detail-view';
import { DetailSkeleton } from '@/components/dashboard/skeletons';

function EmployerProjectDetailContent() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? '';

  return (
    <ProjectDetailView
      projectId={projectId}
      mode="dashboard"
      defaultBackHref="/dashboard/employer/projects"
      defaultBackLabel="Back to my projects"
    />
  );
}

export default function EmployerProjectDetailPage() {
  return (
    <Suspense fallback={<DetailSkeleton label="Loading project" />}>
      <EmployerProjectDetailContent />
    </Suspense>
  );
}
