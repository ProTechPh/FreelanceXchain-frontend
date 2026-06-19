'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { projectsApi } from '@/lib/api';
import type { Project } from '@/types';
import { toast } from 'sonner';
import {
  Zap,
  Calendar,
  Target,
  Send,
  Heart,
  Share2,
  Loader2,
} from 'lucide-react';

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await projectsApi.get(params.id as string);
        setProject(res.data.data);
      } catch {
        toast.error('Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) {
      fetchProject();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{project.title}</h1>
                <Badge className="bg-green-500/10 text-green-500">{project.status}</Badge>
                {project.is_rush && (
                  <Badge className="bg-amber-500/10 text-amber-500">
                    <Zap className="w-3 h-3 mr-1" /> Rush +{project.rush_fee_percentage}%
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">Posted by {project.employer?.name || 'Unknown'} • {new Date(project.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Heart className="w-4 h-4 mr-2" /> Save
              </Button>
              <Button variant="outline">
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
              <Button className="gradient-primary text-white">
                <Send className="w-4 h-4 mr-2" /> Submit Proposal
              </Button>
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
                      <p className="font-semibold text-primary">${milestone.amount.toLocaleString()}</p>
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
                  {project.required_skills?.map((skill) => (
                    <Badge key={skill.id} variant="secondary" className="text-sm py-1.5 px-3">
                      {skill.name}
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
                  <span className="font-semibold">{project.proposal_count || 0}</span>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Posted {new Date(project.created_at).toLocaleDateString()}
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
                      <p className="text-sm text-muted-foreground">{project.employer.company_name || 'Company'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
