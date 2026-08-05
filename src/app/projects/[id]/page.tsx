'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { projectsApi } from '@/lib/api';
import { ProposalDialog } from '@/components/projects/ProposalDialog';
import type { Project } from '@/types';
import { getStatusColor } from '@/lib/status-styles';
import { getProjectPrimaryAction } from '@/lib/project-actions';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import {
  Zap,
  Calendar,
  Target,
  Send,
  Heart,
  Share2,
  Loader2,
  SearchX,
  ClipboardList,
} from 'lucide-react';

export default function ProjectDetailPage() {
  const params = useParams();
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
          <SearchX className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const primaryAction = getProjectPrimaryAction(user, project);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{project.title}</h1>
                <Badge className={getStatusColor(project.status)}>{project.status.replace('_', ' ')}</Badge>
                {project.isRush && (
                  <Badge className="bg-amber-500/10 text-amber-500">
                    <Zap className="w-3 h-3 mr-1" /> Rush +{project.rushFeePercentage}%
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">Posted by {project.employer?.name || 'Unknown'} • {new Date(project.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline">
                <Heart className="w-4 h-4 mr-2" /> Save
              </Button>
              <Button variant="outline">
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
              {primaryAction === 'manage-proposals' && (
                <Button asChild variant="gradient" className="glow-sm-primary">
                  <Link href={`/dashboard/employer/projects/${project.id}/proposals`}>
                    <ClipboardList className="w-4 h-4 mr-2" />
                    View Proposals ({project.proposalCount ?? 0})
                  </Link>
                </Button>
              )}
              {primaryAction === 'submit-proposal' && (
                <Button
                  variant="gradient"
                  className="glow-sm-primary"
                  onClick={() => setProposalOpen(true)}
                >
                  <Send className="w-4 h-4 mr-2" /> Submit Proposal
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Project Description</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-invert max-w-none">
                <p>{project.description}</p>
              </CardContent>
            </Card>

            {/* Milestones */}
            {project.milestones && project.milestones.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" /> Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.milestones.map((milestone, i) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium">{milestone.title}</p>
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(milestone.status)}>{milestone.status.replace('_', ' ')}</Badge>
                        <p className="font-semibold text-primary">${milestone.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Skills Required */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Skills Required</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.requiredSkills?.map((skill) => (
                    <Badge key={skill.skillId ?? skill.skillName} variant="secondary" className="text-sm py-1.5 px-3">
                      {skill.skillName}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-semibold text-primary text-lg">${project.budget.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Deadline</span>
                  <span className="font-semibold">{project.deadline}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Proposals</span>
                  <span className="font-semibold">{project.proposalCount || 0}</span>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Posted {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employer Info */}
            {project.employer && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>About Employer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {project.employer.name?.split(' ').map(n => n[0]).join('') || '?'}
                    </div>
                    <div>
                      <p className="font-semibold">{project.employer.name}</p>
                      <p className="text-sm text-muted-foreground">{project.employer.companyName || 'Company'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

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
