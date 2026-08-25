'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import Link from 'next/link';
import { projectsApi } from '@/lib/api';
import type { Project, ProjectStatus } from '@/types';
import { toast } from 'sonner';
import { PlusCircle, Clock, DollarSign, Users, Eye, Loader2, FolderSearch, ClipboardList, Pencil } from 'lucide-react';

export default function EmployerProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await projectsApi.getMyProjects();
      setProjects(data.items);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const countByStatus = (status: ProjectStatus) => projects.filter((p) => p.status === status).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My projects</h1>
          <p className="text-muted-foreground">Manage your project listings</p>
        </div>
        <Link href="/dashboard/employer/projects/new">
          <Button variant="gradient">
            <PlusCircle className="w-4 h-4 mr-2" /> Post Project
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{projects.length}</p>
            <p className="text-xs text-muted-foreground">Total Projects</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-success">{countByStatus('open')}</p>
            <p className="text-xs text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-info">{countByStatus('in_progress')}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-primary">{countByStatus('completed')}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
            <FolderSearch className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">You haven&apos;t posted any projects yet</p>
          <Link href="/dashboard/employer/projects/new">
            <Button variant="gradient">
              <PlusCircle className="w-4 h-4 mr-2" /> Post your first project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <Card key={project.id} className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{project.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                  </div>
                  <StatusBadge status={project.status} domain="project" />
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.requiredSkills?.map((skill) => (
                    <Badge key={skill.skillId ?? skill.skillName} variant="secondary" className="text-xs">
                      {skill.skillName}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium text-primary">${project.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {project.proposalCount ?? 0} proposals
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Deadline: {new Date(project.deadline).toLocaleDateString()}
                  </div>
                  <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-3">
                  {['draft', 'open'].includes(project.status) && (
                    <Link href={`/dashboard/employer/projects/${project.id}/edit`}>
                      <Button variant="outline" size="sm"><Pencil className="mr-2 size-4" />Edit</Button>
                    </Link>
                  )}
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" /> View
                    </Button>
                  </Link>
                  <Link href={`/dashboard/employer/projects/${project.id}/proposals`}>
                    <Button variant="outline" size="sm">
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Proposals ({project.proposalCount ?? 0})
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
