'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { reportFailure } from '@/lib/report-failure';
import { Button } from '@/components/ui/button';
import { projectsApi, proposalsApi } from '@/lib/api';
import { ProposalDialog } from '@/components/projects/ProposalDialog';
import { EmployerProfileDialog } from '@/components/employers/employer-profile-dialog';
import type { Project, Proposal } from '@/types';
import { getProjectPrimaryAction } from '@/lib/project-actions';
import { formatAmount } from '@/lib/format';
import { useAuthStore } from '@/stores/authStore';
import { useInvalidateMyProposals } from '@/hooks/use-my-proposals';
import { getMarketplaceReturnPath } from '@/lib/marketplace-return';
import { DetailSkeleton } from '@/components/dashboard/skeletons';
import { AttachmentPreviewDialog, type AttachmentPreviewTarget } from '@/components/ui/attachment-preview-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Navbar from '@/components/layout/navbar';
import { FooterSection } from '@/components/layout/footer-section';
import { ProjectDetailHeader } from './detail/project-detail-header';
import { ProjectSubmittedProposal } from './detail/project-submitted-proposal';
import { ProjectDescriptionCard } from './detail/project-description-card';
import { ProjectMilestonesCard } from './detail/project-milestones-card';
import { ProjectEmployerSidebar } from './detail/project-employer-sidebar';

interface ProjectDetailViewProps {
  projectId: string;
  mode?: 'dashboard' | 'public';
  defaultBackHref?: string;
  defaultBackLabel?: string;
}

export function ProjectDetailView({
  projectId,
  mode = 'dashboard',
  defaultBackHref,
  defaultBackLabel = 'Back to projects',
}: ProjectDetailViewProps) {
  const searchParams = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [autoGenerateAI, setAutoGenerateAI] = useState(false);
  const [employerDialogOpen, setEmployerDialogOpen] = useState(false);
  const [myProposal, setMyProposal] = useState<Proposal | null>(null);
  const [withdrawingProposal, setWithdrawingProposal] = useState(false);
  const [confirmWithdrawOpen, setConfirmWithdrawOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreviewTarget | null>(null);
  const user = useAuthStore((state) => state.user);
  const invalidateMyProposals = useInvalidateMyProposals();

  const fallbackBackPath = defaultBackHref || (mode === 'public' ? '/projects' : `/dashboard/${user?.role || 'employer'}/projects`);
  const backPath = getMarketplaceReturnPath(searchParams?.get('from'), fallbackBackPath);

  const fetchMyProposal = useCallback(async () => {
    if (!user || user.role !== 'freelancer') return;
    try {
      const res = await proposalsApi.getMine();
      const proposals = Array.isArray(res.data) ? res.data : (res.data as { items?: Proposal[] })?.items || [];
      const match = proposals.find(
        (p: Proposal) =>
          p.projectId === projectId ||
          (typeof p.project === 'object' && p.project?.id === projectId)
      );
      if (match) setMyProposal(match);
    } catch {
      // Non-blocking: fail silently if proposal fetch fails
    }
  }, [user, projectId]);

  useEffect(() => {
    let cancelled = false;
    async function fetchProject() {
      setLoading(true);
      setFetchError(false);
      try {
        const res = await projectsApi.get(projectId);
        if (!cancelled) {
          setProject(res.data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 404) {
            setProject(null);
          } else {
            setFetchError(true);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (projectId) {
      void fetchProject();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchMyProposal();
    }

    return () => {
      cancelled = true;
    };
  }, [projectId, retryCount, fetchMyProposal]);

  const handleWithdrawProposal = useCallback(async (proposalId: string) => {
    setWithdrawingProposal(true);
    try {
      await proposalsApi.withdraw(proposalId);
      toast.success('Proposal withdrawn successfully');
      setMyProposal((curr) => curr ? { ...curr, status: 'withdrawn' } : null);
      setProject((curr) => curr ? { ...curr, proposalCount: Math.max(0, (curr.proposalCount ?? 1) - 1) } : null);
    } catch (err) {
      reportFailure(err, 'withdraw proposal');
    } finally {
      setWithdrawingProposal(false);
    }
  }, []);

  const shareProject = useCallback(async () => {
    if (!project) return;
    const url = typeof window !== 'undefined' ? `${window.location.origin}/projects/${project.id}` : '';
    if (navigator.share) {
      try {
        await navigator.share({ title: project.title, text: project.description, url });
      } catch {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Project link copied to clipboard!');
      } catch {
        toast.error('Couldn\'t copy to clipboard. Try selecting and copying the link manually.');
      }
    }
  }, [project]);

  // Compute derived values early for useCallback below
  const primaryAction = project ? getProjectPrimaryAction(user, project) : '';
  const isOwner = Boolean(project && user?.role === 'employer' && user?.id === project.employerId);

  // Define useCallback before any early returns
  const renderContent = useCallback(() => (
    <>
      {project && (
        <ProjectDetailHeader
          project={project}
          user={user}
          mode={mode}
          backPath={backPath}
          defaultBackLabel={defaultBackLabel}
          primaryAction={primaryAction}
          isOwner={isOwner}
          myProposal={myProposal}
          onShare={() => void shareProject()}
          onOpenProposal={(autoAI) => {
            setAutoGenerateAI(autoAI);
            setProposalOpen(true);
          }}
        />
      )}

      <div className={mode === 'public' ? 'max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12' : ''}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {myProposal && (
              <ProjectSubmittedProposal
                proposal={myProposal}
                withdrawing={withdrawingProposal}
                onRequestWithdraw={() => setConfirmWithdrawOpen(true)}
                onPreviewAttachment={setPreviewAttachment}
              />
            )}

            {project && (
              <ProjectDescriptionCard
                project={project}
                onPreviewAttachment={setPreviewAttachment}
              />
            )}

            {project?.milestones && (
              <ProjectMilestonesCard milestones={project.milestones} />
            )}
          </div>

          <div className="space-y-6">
            {project && (
              <ProjectEmployerSidebar
                project={project}
                onOpenEmployerDialog={() => setEmployerDialogOpen(true)}
              />
            )}
          </div>
        </div>
      </div>

      <AttachmentPreviewDialog
        open={Boolean(previewAttachment)}
        onOpenChange={(open) => {
          if (!open) setPreviewAttachment(null);
        }}
        attachment={previewAttachment}
      />

      {project && (
        <EmployerProfileDialog
          open={employerDialogOpen}
          onOpenChange={setEmployerDialogOpen}
          employerId={project.employerId || project.employer?.userId || project.employer?.id}
          projectId={project.id}
          initialProfile={project.employer}
        />
      )}

      {project && primaryAction === 'submit-proposal' && (
        <ProposalDialog
          open={proposalOpen}
          onOpenChange={(next) => {
            setProposalOpen(next);
            if (!next) setAutoGenerateAI(false);
          }}
          initialGenerateAI={autoGenerateAI}
          onSubmitted={() => {
            setProject((current) =>
              current
                ? { ...current, proposalCount: (current.proposalCount ?? 0) + 1 }
                : current,
            );
            void fetchMyProposal();
            // Keeps the "already applied" marker on the browse and
            // recommendation lists in step with what just happened here.
            invalidateMyProposals();
          }}
          project={project}
        />
      )}

      {/* Proposal Withdrawal Confirmation Modal */}
      <Dialog
        open={confirmWithdrawOpen}
        onOpenChange={(open) => {
          if (!open && !withdrawingProposal) setConfirmWithdrawOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Withdraw this proposal?</DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw your proposal for{' '}
              <strong className="text-foreground">
                &quot;{project?.title ?? 'this project'}&quot;
              </strong>
              ? You will be removed from consideration and cannot un-withdraw.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmWithdrawOpen(false)}
              disabled={withdrawingProposal}
            >
              Keep Proposal
            </Button>
            <Button
              variant="destructive"
              loading={withdrawingProposal}
              loadingText="Withdrawing…"
              onClick={async () => {
                if (!myProposal) return;
                await handleWithdrawProposal(myProposal.id);
                setConfirmWithdrawOpen(false);
              }}
            >
              Confirm Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sticky mobile CTA bar */}
      {project && primaryAction === 'submit-proposal' && !myProposal && (
        <div className="fixed bottom-0 inset-x-0 p-3 bg-background/95 backdrop-blur border-t sm:hidden z-40 flex items-center justify-between gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg">
          <div className="min-w-0">
            <span className="block text-3xs uppercase tracking-wider text-muted-foreground">Budget</span>
            <span className="font-bold text-primary text-sm truncate">{formatAmount(project.budget)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-primary/40 text-primary font-medium min-h-[44px] px-3"
              onClick={() => {
                setAutoGenerateAI(true);
                setProposalOpen(true);
              }}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-primary" />
              AI
            </Button>
            <Button
              size="sm"
              className="rounded-full gradient-primary shadow-md min-h-[44px] px-4 font-semibold"
              onClick={() => {
                setAutoGenerateAI(false);
                setProposalOpen(true);
              }}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" /> Submit Proposal
            </Button>
          </div>
        </div>
      )}
    </>
  ), [project, user, mode, backPath, defaultBackLabel, primaryAction, isOwner, myProposal, withdrawingProposal, proposalOpen, autoGenerateAI, employerDialogOpen, previewAttachment, confirmWithdrawOpen, handleWithdrawProposal, shareProject, fetchMyProposal, invalidateMyProposals]);

  if (loading) {
    if (mode === 'public') {
      return (
        <div className="flex min-h-screen flex-col bg-background">
          <Navbar />
          <main className="flex-1 pt-28 pb-20">
            <DetailSkeleton label="Loading project" />
          </main>
          <FooterSection />
        </div>
      );
    }
    return <DetailSkeleton label="Loading project" />;
  }

  if (fetchError && !project) {
    const errorCard = (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-3xl border border-border/80 shadow-md max-w-md mx-auto">
        <p className="text-lg font-medium">Failed to load project</p>
        <p className="text-muted-foreground mt-1">Check your connection and try again.</p>
        <Button className="mt-4 rounded-full gradient-primary" onClick={() => setRetryCount(c => c + 1)}>Try Again</Button>
      </div>
    );

    if (mode === 'public') {
      return (
        <div className="flex min-h-screen flex-col bg-background">
          <Navbar />
          <main className="flex-1 pt-28 pb-20 flex items-center justify-center">{errorCard}</main>
          <FooterSection />
        </div>
      );
    }
    return errorCard;
  }

  if (!project) {
    const notFoundCard = (
      <div className="text-center rounded-3xl bg-card border border-border/80 p-12 shadow-md shadow-black/5 max-w-md mx-auto">
        <p className="text-3xl mb-4">🔍</p>
        <h2 className="text-2xl font-bold text-foreground mb-2">Project not found</h2>
        <p className="text-muted-foreground mb-6">This project doesn&apos;t exist or has been removed.</p>
        <Button asChild className="rounded-full gradient-primary shadow-md">
          <Link href={mode === 'public' ? '/projects' : fallbackBackPath}>
            {mode === 'public' ? 'Browse Projects' : defaultBackLabel}
          </Link>
        </Button>
      </div>
    );

    if (mode === 'public') {
      return (
        <div className="flex min-h-screen flex-col bg-background">
          <Navbar />
          <main className="flex-1 pt-28 pb-20 flex items-center justify-center">{notFoundCard}</main>
          <FooterSection />
        </div>
      );
    }
    return <div className="py-20 text-center">{notFoundCard}</div>;
  }

  if (mode === 'public') {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-28 pb-20">{renderContent()}</main>
        <FooterSection />
      </div>
    );
  }

  return <div className="space-y-6">{renderContent()}</div>;
}

