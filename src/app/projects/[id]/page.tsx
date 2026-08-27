'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ProjectDetailView } from '@/components/projects/project-detail-view';
import { DetailSkeleton } from '@/components/dashboard/skeletons';
import Navbar from '@/components/layout/navbar';
import { FooterSection } from '@/components/layout/footer-section';

function PublicProjectDetailContent() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? '';

  return (
    <ProjectDetailView
      projectId={projectId}
      mode="public"
      defaultBackHref="/projects"
      defaultBackLabel="Back to projects"
    />
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-background">
          <Navbar />
          <main className="flex-1 pt-28 pb-20">
            <DetailSkeleton label="Loading project" />
          </main>
          <FooterSection />
        </div>
      }
    >
      <PublicProjectDetailContent />
    </Suspense>
  );
}
