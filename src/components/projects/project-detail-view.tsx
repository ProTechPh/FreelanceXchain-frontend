'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Zap, ShieldCheck, Send, Share2, ExternalLink, Paperclip, Pencil, ClipboardList, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { projectsApi } from '@/lib/api';
import { ProposalDialog } from '@/components/projects/ProposalDialog';
import { FavoriteButton } from '@/components/marketplace/favorite-button';
import type { Project } from '@/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { getProjectPrimaryAction } from '@/lib/project-actions';
import { formatFileSize, safeAttachmentUrl } from '@/lib/attachment-presentation';
import { useAuthStore } from '@/stores/authStore';
import { getMarketplaceReturnPath } from '@/lib/marketplace-return';
import { DetailSkeleton } from '@/components/dashboard/skeletons';
import Navbar from '@/components/layout/navbar';
import { FooterSection } from '@/components/layout/footer-section';

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days left`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatPostedDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

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
  const [proposalOpen, setProposalOpen] = useState(false);
  const [autoGenerateAI, setAutoGenerateAI] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    let active = true;
    const fetchProject = async () => {
      try {
        const res = await projectsApi.get(projectId);
        if (active) {
          setProject(res.data);
        }
      } catch {
        if (active) {
          toast.error('Failed to load project');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (projectId) {
      void fetchProject();
    }
    return () => {
      active = false;
    };
  }, [projectId]);

  const fallbackBackPath = defaultBackHref ?? (mode === 'public' ? '/projects' : '/dashboard/freelancer/projects');
  const backPath = getMarketplaceReturnPath(searchParams?.get('returnTo') ?? null, fallbackBackPath);

  const shareProject = async () => {
    if (!project) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: project.title, url: window.location.href });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Project link copied.');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('Unable to share this project.');
    }
  };

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

  if (!project) {
    if (mode === 'public') {
      return (
        <div className="flex min-h-screen flex-col bg-background">
          <Navbar />
          <main className="flex-1 pt-28 pb-20 flex items-center justify-center">
            <div className="text-center rounded-3xl bg-card border border-border/80 p-12 shadow-md shadow-black/5 max-w-md mx-auto">
              <p className="text-3xl mb-4">🔍</p>
              <h2 className="text-2xl font-bold text-foreground mb-2">Project not found</h2>
              <p className="text-muted-foreground mb-6">This project doesn&apos;t exist or has been removed.</p>
              <Link href="/projects">
                <Button className="rounded-full gradient-primary text-primary-foreground shadow-md">
                  Browse Projects
                </Button>
              </Link>
            </div>
          </main>
          <FooterSection />
        </div>
      );
    }

    return (
      <div className="py-20 text-center">
        <div className="text-center rounded-2xl bg-card border border-border p-8 max-w-md mx-auto space-y-4">
          <p className="text-3xl">🔍</p>
          <h2 className="text-xl font-bold text-foreground">Project not found</h2>
          <p className="text-sm text-muted-foreground">This project doesn&apos;t exist or has been removed.</p>
          <Button asChild variant="outline" className="mt-2">
            <Link href={fallbackBackPath}>{defaultBackLabel}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const primaryAction = getProjectPrimaryAction(user, project);
  const isOwner = user?.role === 'employer' && user?.id === project.employerId;
  const employerInitials = project.employer?.name?.split(' ').map((n) => n[0]).join('') || '?';

  const renderContent = () => (
    <>
      {/* Header / Meta section */}
      <div className={mode === 'public' ? 'relative border-b border-border/80 bg-card/50 backdrop-blur-xl' : 'space-y-4 mb-6'}>
        {mode === 'public' && <div className="absolute inset-0 gradient-primary opacity-5" />}
        <div className={mode === 'public' ? 'relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12' : ''}>
          {/* Back Button */}
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-4 text-muted-foreground hover:text-foreground">
            <Link href={backPath}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {defaultBackLabel}
            </Link>
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Title + Meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {project.title}
                </h1>
                <StatusBadge status={project.status} domain="project" />
                {project.isRush && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning bg-warning/10 border border-warning/20 px-3 py-1 rounded-full">
                    <Zap className="w-3.5 h-3.5" />
                    Rush +{project.rushFeePercentage}%
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Posted by <span className="font-semibold text-foreground">{project.employer?.name || 'Unknown Employer'}</span>
                {project.createdAt ? ` • ${formatPostedDate(project.createdAt)}` : ''}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <FavoriteButton targetType="project" targetId={project.id} />
              <Button type="button" variant="outline" className="rounded-full" onClick={() => void shareProject()}>
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>

              {isOwner && (
                <>
                  {['draft', 'open'].includes(project.status) && (
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href={`/dashboard/employer/projects/${project.id}/edit`}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </Link>
                    </Button>
                  )}
                  <Button asChild className="rounded-full gradient-primary text-primary-foreground shadow-md">
                    <Link href={`/dashboard/employer/projects/${project.id}/proposals`}>
                      <ClipboardList className="w-4 h-4 mr-2" />
                      View Proposals ({project.proposalCount ?? 0})
                    </Link>
                  </Button>
                </>
              )}

              {!isOwner && primaryAction === 'manage-proposals' && (
                <Button asChild className="rounded-full gradient-primary text-primary-foreground shadow-md">
                  <Link href={`/dashboard/employer/projects/${project.id}/proposals`}>
                    View Proposals ({project.proposalCount ?? 0})
                  </Link>
                </Button>
              )}

              {primaryAction === 'submit-proposal' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-medium shadow-sm gap-1.5"
                    onClick={() => {
                      setAutoGenerateAI(true);
                      setProposalOpen(true);
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    AI Proposal
                  </Button>
                  <Button
                    className="rounded-full gradient-primary text-primary-foreground shadow-md"
                    onClick={() => {
                      setAutoGenerateAI(false);
                      setProposalOpen(true);
                    }}
                  >
                    <Send className="w-4 h-4 mr-2" /> Submit Proposal
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className={mode === 'public' ? 'max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12' : ''}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column (2 Cols) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            <Card className="rounded-2xl border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Project Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {project.description}
                </p>
              </CardContent>
            </Card>

            {/* Attachments */}
            {project.attachments && project.attachments.length > 0 && (
              <Card className="rounded-2xl border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Paperclip className="size-5" />
                    Reference Attachments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {project.attachments.map((attachment) => {
                      const url = safeAttachmentUrl(attachment.url);
                      return (
                        <div
                          key={`${attachment.filename}-${attachment.url}`}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background/50 border border-border/50"
                        >
                          <span className="min-w-0 truncate text-sm">
                            {attachment.filename}
                            <span className="text-xs text-muted-foreground ml-2">
                              ({formatFileSize(attachment.size)})
                            </span>
                          </span>
                          {url ? (
                            <Button asChild variant="ghost" size="sm" className="rounded-full">
                              <a href={url} target="_blank" rel="noreferrer">
                                Open <ExternalLink className="ml-1.5 h-3 w-3" />
                              </a>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Unavailable</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Milestones */}
            {project.milestones && project.milestones.length > 0 && (
              <Card className="rounded-2xl border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground">Milestones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.milestones.map((milestone, i) => (
                      <div
                        key={milestone.id}
                        className="p-4 rounded-xl bg-secondary/20 border border-border/60"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                              {i + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm text-foreground">{milestone.title}</h4>
                              {milestone.description && (
                                <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <StatusBadge status={milestone.status} domain="milestone" size="sm" />
                            <p className="font-bold text-sm text-primary">${milestone.amount.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skills Required */}
            {project.requiredSkills && project.requiredSkills.length > 0 && (
              <Card className="rounded-2xl border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground">Skills Required</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.requiredSkills.map((skill) => (
                      <span
                        key={skill.skillId ?? skill.skillName}
                        className="px-3 py-1 rounded-full bg-secondary/50 border border-border text-xs font-medium text-foreground"
                      >
                        {skill.skillName}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Project Stats */}
            <Card className="rounded-2xl border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base font-bold text-foreground">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Budget</span>
                  <span className="font-bold text-primary text-lg">${project.budget.toLocaleString()} USDC</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Deadline</span>
                  <span className="text-sm font-semibold text-foreground">{formatDate(project.deadline)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Proposals</span>
                  <span className="text-sm font-semibold text-foreground">{project.proposalCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Posted</span>
                  <span className="text-sm font-semibold text-foreground">{formatPostedDate(project.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Employer Info */}
            {project.employer && (
              <Card className="rounded-2xl border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-foreground">About Employer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm flex items-center justify-center shadow-sm">
                      {employerInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground truncate">{project.employer.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{project.employer.companyName || 'Verified client'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trust Badge */}
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-5 text-center">
              <ShieldCheck className="size-8 text-primary mx-auto mb-2" />
              <h4 className="font-bold text-foreground text-sm">Escrow Protected</h4>
              <p className="text-xs text-muted-foreground mt-1">Funds secured in smart contract</p>
            </div>
          </div>
        </div>
      </div>

      {primaryAction === 'submit-proposal' && (
        <ProposalDialog
          open={proposalOpen}
          onOpenChange={(next) => {
            setProposalOpen(next);
            if (!next) setAutoGenerateAI(false);
          }}
          initialGenerateAI={autoGenerateAI}
          onSubmitted={() =>
            setProject((current) =>
              current
                ? { ...current, proposalCount: (current.proposalCount ?? 0) + 1 }
                : current,
            )
          }
          project={project}
        />
      )}
    </>
  );

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
