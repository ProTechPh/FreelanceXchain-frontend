'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import Link from 'next/link';
import { projectsApi } from '@/lib/api';
import type { Project, ProjectStatus } from '@/types';
import { reportLoadFailure } from '@/lib/report-failure';
import { PlusCircle, Clock, DollarSign, Users, Eye, FolderSearch, ClipboardList, Pencil } from 'lucide-react';
import { ListSkeleton } from '@/components/dashboard/skeletons';
import { formatAmount, formatDate } from '@/lib/format';

export default function EmployerProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await projectsApi.getMyProjects();
    setProjects(data.items);
  }, []);

  // Reporting lives here rather than inside `load` so the toast's Retry can call
  // `load` again — a self-reference inside the callback is not allowed.
  useEffect(() => {
    let active = true;
    function run() {
      load()
        .catch((error) => {
          if (active) reportLoadFailure(error, 'your projects', run);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    run();
    return () => {
      active = false;
    };
  }, [load]);

  const countByStatus = (status: ProjectStatus) => projects.filter((p) => p.status === status).length;

  if (loading) {
    return (
      <ListSkeleton rows={4} label="Loading your projects" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My projects</h1>
          <p className="text-muted-foreground">Manage your project listings</p>
        </div>
        <Button asChild variant="gradient" className="w-full sm:w-auto shrink-0">
          <Link href="/dashboard/employer/projects/new">
            <PlusCircle className="w-4 h-4 mr-2" /> Post Project
          </Link>
        </Button>
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
          <Button asChild variant="gradient">
            <Link href="/dashboard/employer/projects/new">
              <PlusCircle className="w-4 h-4 mr-2" /> Post your first project
            </Link>
          </Button>
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
                    <span className="font-medium text-primary">{formatAmount(project.budget)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {project.proposalCount ?? 0} proposals
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Deadline: {formatDate(project.deadline)}
                  </div>
                  <span>Created {formatDate(project.createdAt)}</span>
                </div>

                <div className="flex items-center gap-3">
                  {['draft', 'open'].includes(project.status) && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/employer/projects/${project.id}/edit`}>
                        <Pencil className="mr-2 size-4" />Edit
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/employer/projects/${project.id}`}>
                      <Eye className="w-4 h-4 mr-2" /> View
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/employer/projects/${project.id}/proposals`}>
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Proposals ({project.proposalCount ?? 0})
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
