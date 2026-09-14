'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  ClipboardList,
  Pencil,
  Send,
  Share2,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { Project, Proposal, User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { FavoriteButton } from '@/components/marketplace/favorite-button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { formatPostedDate } from './project-meta-helpers';

interface ProjectDetailHeaderProps {
  project: Project;
  user: User | null;
  mode: 'dashboard' | 'public';
  backPath: string;
  defaultBackLabel: string;
  primaryAction: string;
  isOwner: boolean;
  myProposal: Proposal | null;
  onShare: () => void;
  onOpenProposal: (autoAI: boolean) => void;
}

export function ProjectDetailHeader({
  project,
  user,
  mode,
  backPath,
  defaultBackLabel,
  primaryAction,
  isOwner,
  myProposal,
  onShare,
  onOpenProposal,
}: ProjectDetailHeaderProps) {
  return (
    <div className={mode === 'public' ? 'relative border-b border-border/80 bg-card/50 backdrop-blur-xl' : 'space-y-4 mb-6'}>
      {mode === 'public' && <div className="absolute inset-0 gradient-primary opacity-5" />}
      <div className={mode === 'public' ? 'relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12' : ''}>
        {/* Breadcrumbs & Back Navigation */}
        <div className="space-y-3 mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={mode === 'public' ? '/' : `/dashboard/${user?.role || 'employer'}`}>
                  {mode === 'public' ? 'Home' : 'Dashboard'}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={mode === 'public' ? '/projects' : `/dashboard/${user?.role || 'employer'}/projects`}>
                  Projects
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{project.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground hover:text-foreground">
            <Link href={backPath}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {defaultBackLabel}
            </Link>
          </Button>
        </div>

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
              Posted by <span className="font-semibold text-foreground">{project.employer?.name || project.employer?.companyName || 'Employer'}</span>
              {project.createdAt ? ` • ${formatPostedDate(project.createdAt)}` : ''}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <FavoriteButton targetType="project" targetId={project.id} />
            <Button type="button" variant="outline" className="rounded-full" onClick={onShare}>
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
                <Button asChild className="rounded-full gradient-primary shadow-md">
                  <Link href={`/dashboard/employer/projects/${project.id}/proposals`}>
                    <ClipboardList className="w-4 h-4 mr-2" />
                    View Proposals ({project.proposalCount ?? 0})
                  </Link>
                </Button>
              </>
            )}

            {!isOwner && primaryAction === 'manage-proposals' && (
              <Button asChild className="rounded-full gradient-primary shadow-md">
                <Link href={`/dashboard/employer/projects/${project.id}/proposals`}>
                  View Proposals ({project.proposalCount ?? 0})
                </Link>
              </Button>
            )}

            {primaryAction === 'submit-proposal' && (
              <>
                {myProposal ? (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        myProposal.status === 'accepted'
                          ? 'h-9 px-3.5 rounded-full border-success/40 bg-success/10 text-success gap-1.5 text-xs font-semibold shadow-sm'
                          : myProposal.status === 'rejected'
                            ? 'h-9 px-3.5 rounded-full border-destructive/40 bg-destructive/10 text-destructive gap-1.5 text-xs font-semibold shadow-sm'
                            : 'h-9 px-3.5 rounded-full border-warning/40 bg-warning/10 text-warning gap-1.5 text-xs font-semibold shadow-sm'
                      }
                    >
                      <CheckCircle className="size-4" />
                      Proposal Submitted ({myProposal.status.toUpperCase()})
                    </Badge>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href="/dashboard/freelancer/proposals">
                        <ClipboardList className="size-4 mr-1.5" />
                        My Proposals
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-medium shadow-sm gap-1.5"
                      onClick={() => onOpenProposal(true)}
                    >
                      <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                      AI Proposal
                    </Button>
                    <Button
                      className="rounded-full gradient-primary shadow-md"
                      onClick={() => onOpenProposal(false)}
                    >
                      <Send className="w-4 h-4 mr-2" /> Submit Proposal
                    </Button>
                  </>
                )}
              </>
            )}

            {primaryAction === 'sign-in-to-submit' && (
              <Button asChild className="rounded-full gradient-primary shadow-md">
                <Link href={`/login?returnTo=${encodeURIComponent(`/projects/${project.id}`)}`}>
                  <Send className="w-4 h-4 mr-2" /> Sign in to Submit Proposal
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
