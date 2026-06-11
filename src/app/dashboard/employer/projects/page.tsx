'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  PlusCircle,
  Clock,
  DollarSign,
  Users,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
} from 'lucide-react';

const projects = [
  {
    id: '1',
    title: 'E-commerce Platform Redesign',
    description: 'Complete redesign of the e-commerce platform with modern UI/UX.',
    budget: '$3,200',
    status: 'in_progress',
    proposals: 8,
    deadline: 'Dec 20, 2024',
    skills: ['React', 'Node.js', 'TypeScript'],
    created: 'Nov 15, 2024',
  },
  {
    id: '2',
    title: 'Mobile App Development',
    description: 'Build a cross-platform mobile app for iOS and Android.',
    budget: '$5,500',
    status: 'in_progress',
    proposals: 12,
    deadline: 'Jan 15, 2025',
    skills: ['React Native', 'Firebase', 'TypeScript'],
    created: 'Nov 10, 2024',
  },
  {
    id: '3',
    title: 'Smart Contract Audit',
    description: 'Security audit for DeFi protocol smart contracts.',
    budget: '$2,800',
    status: 'completed',
    proposals: 5,
    deadline: 'Dec 10, 2024',
    skills: ['Solidity', 'Security', 'Testing'],
    created: 'Nov 5, 2024',
  },
  {
    id: '4',
    title: 'DAO Governance Dashboard',
    description: 'Build a comprehensive governance dashboard for DAOs.',
    budget: '$4,500',
    status: 'open',
    proposals: 15,
    deadline: 'Feb 1, 2025',
    skills: ['React', 'Solidity', 'GraphQL'],
    created: 'Nov 20, 2024',
  },
];

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-500',
  open: 'bg-green-500/10 text-green-500',
  in_progress: 'bg-blue-500/10 text-blue-500',
  completed: 'bg-primary/10 text-primary',
  cancelled: 'bg-red-500/10 text-red-500',
};

export default function EmployerProjectsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">Manage your project listings</p>
        </div>
        <Link href="/dashboard/employer/projects/new">
          <Button className="gradient-primary text-white">
            <PlusCircle className="w-4 h-4 mr-2" /> Post Project
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">4</p>
            <p className="text-xs text-muted-foreground">Total Projects</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-500">1</p>
            <p className="text-xs text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-blue-500">2</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-primary">1</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {projects.map((project) => (
          <Card key={project.id} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{project.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                </div>
                <Badge className={statusColors[project.status]}>
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {project.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium text-primary">{project.budget}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {project.proposals} proposals
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Deadline: {project.deadline}
                </div>
                <span>Created {project.created}</span>
              </div>

              <div className="flex items-center gap-3">
                <Link href={`/projects/${project.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" /> View
                  </Button>
                </Link>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
