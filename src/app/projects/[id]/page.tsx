'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { projectsApi } from '@/lib/api';
import { ProposalDialog } from '@/components/projects/ProposalDialog';
import { FavoriteButton } from '@/components/marketplace/favorite-button';
import type { Project } from '@/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { getProjectPrimaryAction } from '@/lib/project-actions';
import { formatFileSize, safeAttachmentUrl } from '@/lib/attachment-presentation';
import { useAuthStore } from '@/stores/authStore';
import { getMarketplaceReturnPath } from '@/lib/marketplace-return';
import { toast } from 'sonner';
import { ArrowLeft, Zap, ShieldCheck, DollarSign, Clock, Users, Calendar, Send, Share2, ExternalLink, Paperclip } from 'lucide-react';
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

export default function ProjectDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposalOpen, setProposalOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await projectsApi.get(params?.id as string);
        setProject(res.data);
      } catch {
        toast.error('Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    if (params?.id) {
      fetchProject();
    }
  }, [params?.id]);

  if (loading) {
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

  if (!project) {
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

  const primaryAction = getProjectPrimaryAction(user, project);
  const marketplaceBackPath = getMarketplaceReturnPath(searchParams?.get('returnTo') ?? null, '/projects');
  const employerInitials = project.employer?.name?.split(' ').map(n => n[0]).join('') || '?';

  const shareProject = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: project.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Project link copied.');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('Unable to share this project.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-28 pb-20">
        {/* Hero Header */}
        <div className="relative border-b border-border/80 bg-card/50 backdrop-blur-xl">
          <div className="absolute inset-0 gradient-primary opacity-5" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            {/* Back Button */}
            <Link 
              href={marketplaceBackPath}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to projects
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Title + Meta */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
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
                  Posted by <span className="font-semibold text-foreground">{project.employer?.name || 'Unknown Employer'}</span> • {formatPostedDate(project.createdAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 lg:flex-shrink-0">
                <FavoriteButton targetType="project" targetId={project.id} />
                <Button type="button" variant="outline" className="rounded-full" onClick={() => void shareProject()}>
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
                {primaryAction === 'manage-proposals' && (
                  <Button asChild className="rounded-full gradient-primary text-primary-foreground shadow-md">
                    <Link href={`/dashboard/employer/projects/${project.id}/proposals`}>
                      View Proposals ({project.proposalCount ?? 0})
                    </Link>
                  </Button>
                )}
                {primaryAction === 'submit-proposal' && (
                  <Button
                    className="rounded-full gradient-primary text-primary-foreground shadow-md"
                    onClick={() => setProposalOpen(true)}
                  >
                    <Send className="w-4 h-4 mr-2" /> Submit Proposal
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-md shadow-black/5">
                <h2 className="text-lg font-bold text-foreground mb-4">Project Description</h2>
                <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>

              {/* Attachments */}
              {project.attachments.length > 0 && (
                <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-md shadow-black/5">
                  <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Paperclip className="w-5 h-5" />
                    Reference Attachments
                  </h2>
                  <div className="space-y-2">
                    {project.attachments.map((attachment) => {
                      const url = safeAttachmentUrl(attachment.url);
                      return (
                        <div key={`${attachment.filename}-${attachment.url}`} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background/50 border border-border/50">
                          <span className="min-w-0 truncate text-sm">
                            {attachment.filename}
                            <span className="text-xs text-muted-foreground ml-2">({formatFileSize(attachment.size)})</span>
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
                </div>
              )}

              {/* Milestones */}
              {project.milestones && project.milestones.length > 0 && (
                <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-md shadow-black/5">
                  <h2 className="text-lg font-bold text-foreground mb-5">Milestones</h2>
                  <div className="space-y-4">
                    {project.milestones.map((milestone, i) => (
                      <div
                        key={milestone.id}
                        className="p-5 rounded-2xl bg-background/50 border border-border/50 hover:border-border transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                              {i + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{milestone.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <StatusBadge status={milestone.status} domain="milestone" />
                            <p className="font-bold text-primary">${milestone.amount.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills Required */}
              <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-md shadow-black/5">
                <h2 className="text-lg font-bold text-foreground mb-4">Skills Required</h2>
                <div className="flex flex-wrap gap-2">
                  {project.requiredSkills?.map((skill) => (
                    <span
                      key={skill.skillId ?? skill.skillName}
                      className="px-3 py-1.5 rounded-full bg-background border border-border/80 text-sm font-medium text-foreground/80"
                    >
                      {skill.skillName}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Project Stats */}
              <div className="rounded-3xl bg-card border border-border/80 p-6 shadow-md shadow-black/5">
                <h3 className="text-sm font-bold text-foreground mb-4">Project Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Budget</span>
                    <span className="font-bold text-primary text-lg">${project.budget.toLocaleString()}</span>
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
                </div>
              </div>

              {/* Employer Info */}
              {project.employer && (
                <div className="rounded-3xl bg-card border border-border/80 p-6 shadow-md shadow-black/5">
                  <h3 className="text-sm font-bold text-foreground mb-4">About Employer</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm flex items-center justify-center shadow-sm">
                      {employerInitials}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{project.employer.name}</p>
                      <p className="text-sm text-muted-foreground">{project.employer.companyName || 'Company'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Trust Badge */}
              <div className="rounded-3xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-5 text-center">
                <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-2" />
                <h4 className="font-bold text-foreground text-sm">Escrow Protected</h4>
                <p className="text-xs text-muted-foreground mt-1">Funds secured in smart contract</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterSection />

      {primaryAction === 'submit-proposal' && (
        <ProposalDialog
          open={proposalOpen}
          onOpenChange={setProposalOpen}
          onSubmitted={() => setProject((current) => current
            ? { ...current, proposalCount: (current.proposalCount ?? 0) + 1 }
            : current)}
          project={project}
        />
      )}
    </div>
  );
}
