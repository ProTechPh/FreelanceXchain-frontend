'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  DollarSign,
  FolderOpen,
  FileText,
  Users,
  TrendingUp,
  Clock,
  ArrowUpRight,
  PlusCircle,
  Briefcase,
} from 'lucide-react';

const stats = [
  {
    title: 'Active Projects',
    value: '3',
    change: '1 new this week',
    icon: FolderOpen,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    title: 'Total Spent',
    value: '$24,500',
    change: '+$5,200 this month',
    icon: DollarSign,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    title: 'Pending Proposals',
    value: '18',
    change: '5 new today',
    icon: FileText,
    color: 'text-cyan',
    bg: 'bg-cyan/10',
  },
  {
    title: 'Active Contracts',
    value: '4',
    change: '2 completing soon',
    icon: Briefcase,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
];

const activeProjects = [
  {
    id: '1',
    title: 'E-commerce Platform Redesign',
    budget: '$3,200',
    proposals: 8,
    status: 'in_progress',
    deadline: 'Dec 20, 2024',
    progress: 65,
  },
  {
    id: '2',
    title: 'Mobile App Development',
    budget: '$5,500',
    proposals: 12,
    status: 'in_progress',
    deadline: 'Jan 15, 2025',
    progress: 40,
  },
  {
    id: '3',
    title: 'Smart Contract Audit',
    budget: '$2,800',
    proposals: 5,
    status: 'completed',
    deadline: 'Dec 10, 2024',
    progress: 100,
  },
];

const recentProposals = [
  {
    id: '1',
    freelancer: 'Alex Thompson',
    avatar: 'AT',
    project: 'E-commerce Platform Redesign',
    amount: '$3,200',
    rating: 4.8,
    submitted: '2 hours ago',
    match: 95,
  },
  {
    id: '2',
    freelancer: 'Sarah Chen',
    avatar: 'SC',
    project: 'Mobile App Development',
    amount: '$5,000',
    rating: 4.9,
    submitted: '5 hours ago',
    match: 92,
  },
  {
    id: '3',
    freelancer: 'Mike Johnson',
    avatar: 'MJ',
    project: 'DAO Governance Tool',
    amount: '$4,500',
    rating: 4.7,
    submitted: '1 day ago',
    match: 88,
  },
];

const statusColors: Record<string, string> = {
  open: 'bg-green-500/10 text-green-500',
  in_progress: 'bg-blue-500/10 text-blue-500',
  completed: 'bg-primary/10 text-primary',
};

export default function EmployerDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, TechCorp!</h1>
          <p className="text-muted-foreground">Manage your projects and find talent</p>
        </div>
        <Link href="/dashboard/employer/projects/new">
          <Button className="gradient-primary text-white">
            <PlusCircle className="w-4 h-4 mr-2" /> Post Project
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Active Projects</CardTitle>
              <Link href="/dashboard/employer/projects">
                <Button variant="ghost" size="sm">
                  View All <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/20 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{project.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>{project.proposals} proposals</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {project.deadline}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{project.budget}</p>
                      <Badge className={statusColors[project.status]}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  {project.status === 'in_progress' && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-background rounded-full overflow-hidden">
                        <div
                          className="h-full gradient-primary rounded-full transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Proposals */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Recent Proposals</CardTitle>
            <Link href="/dashboard/employer/proposals">
              <Button variant="ghost" size="sm">
                View All <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProposals.map((proposal) => (
              <div
                key={proposal.id}
                className="p-3 rounded-xl bg-secondary/50 border border-border"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                    {proposal.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{proposal.freelancer}</p>
                    <p className="text-xs text-muted-foreground">{proposal.project}</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-500">{proposal.match}%</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-primary">{proposal.amount}</span>
                  <span>★ {proposal.rating}</span>
                  <span>{proposal.submitted}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/dashboard/employer/projects/new">
          <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium">Post New Project</p>
                <p className="text-xs text-muted-foreground">Create a project listing</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/employer/freelancers">
          <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-cyan" />
              </div>
              <div>
                <p className="font-medium">Find Talent</p>
                <p className="text-xs text-muted-foreground">AI-powered freelancer matching</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/employer/contracts">
          <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Manage Contracts</p>
                <p className="text-xs text-muted-foreground">Review milestones & payments</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
