'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  DollarSign,
  FolderOpen,
  FileText,
  Star,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Briefcase,
  Wallet,
} from 'lucide-react';

const stats = [
  {
    title: 'Total Earned',
    value: '$12,450',
    change: '+$2,100 this month',
    icon: DollarSign,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    title: 'Active Contracts',
    value: '3',
    change: '2 in progress',
    icon: FolderOpen,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    title: 'Pending Proposals',
    value: '5',
    change: '2 new views',
    icon: FileText,
    color: 'text-cyan',
    bg: 'bg-cyan/10',
  },
  {
    title: 'Reputation Score',
    value: '4.8',
    change: 'Top 5% on platform',
    icon: Star,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
];

const activeContracts = [
  {
    id: '1',
    project: 'E-commerce Platform Redesign',
    employer: 'TechCorp Inc.',
    amount: '$3,200',
    milestone: 'UI Components',
    progress: 65,
    deadline: 'Dec 20, 2024',
  },
  {
    id: '2',
    project: 'Mobile App Development',
    employer: 'StartupXYZ',
    amount: '$5,500',
    milestone: 'API Integration',
    progress: 40,
    deadline: 'Jan 15, 2025',
  },
  {
    id: '3',
    project: 'Smart Contract Audit',
    employer: 'DeFi Protocol',
    amount: '$2,800',
    milestone: 'Security Review',
    progress: 85,
    deadline: 'Dec 10, 2024',
  },
];

const recentProposals = [
  {
    id: '1',
    project: 'Blockchain Wallet Integration',
    status: 'pending',
    submitted: '2 hours ago',
    amount: '$4,000',
  },
  {
    id: '2',
    project: 'NFT Marketplace Development',
    status: 'viewed',
    submitted: '1 day ago',
    amount: '$8,500',
  },
  {
    id: '3',
    project: 'DeFi Dashboard UI',
    status: 'shortlisted',
    submitted: '3 days ago',
    amount: '$3,200',
  },
];

const recommendedProjects = [
  {
    id: '1',
    title: 'Web3 Social Media Platform',
    budget: '$6,000 - $10,000',
    skills: ['React', 'Solidity', 'Web3.js'],
    match: '95%',
    posted: '1 day ago',
    proposals: 12,
  },
  {
    id: '2',
    title: 'Crypto Trading Bot',
    budget: '$4,000 - $7,000',
    skills: ['Python', 'TypeScript', 'API'],
    match: '88%',
    posted: '2 days ago',
    proposals: 8,
  },
  {
    id: '3',
    title: 'DAO Governance Tool',
    budget: '$5,000 - $8,000',
    skills: ['React', 'Solidity', 'GraphQL'],
    match: '82%',
    posted: '3 days ago',
    proposals: 15,
  },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  viewed: 'bg-blue-500/10 text-blue-500',
  shortlisted: 'bg-green-500/10 text-green-500',
};

export default function FreelancerDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, Alex!</h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your work</p>
        </div>
        <Link href="/dashboard/freelancer/projects">
          <Button className="gradient-primary text-white">
            <Briefcase className="w-4 h-4 mr-2" /> Browse Projects
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
        {/* Active Contracts */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Active Contracts</CardTitle>
              <Link href="/dashboard/freelancer/contracts">
                <Button variant="ghost" size="sm">
                  View All <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/20 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium">{contract.project}</p>
                      <p className="text-sm text-muted-foreground">{contract.employer}</p>
                    </div>
                    <p className="font-semibold text-primary">{contract.amount}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{contract.milestone}</span>
                        <span className="text-muted-foreground">{contract.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-background rounded-full overflow-hidden">
                        <div
                          className="h-full gradient-primary rounded-full transition-all"
                          style={{ width: `${contract.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {contract.deadline}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Proposals */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Recent Proposals</CardTitle>
            <Link href="/dashboard/freelancer/proposals">
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
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-sm">{proposal.project}</p>
                  <Badge className={statusColors[proposal.status]}>
                    {proposal.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{proposal.amount}</span>
                  <span>{proposal.submitted}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Projects */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">AI Recommended Projects</CardTitle>
          <Link href="/dashboard/freelancer/projects">
            <Button variant="ghost" size="sm">
              View All <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {recommendedProjects.map((project) => (
              <div
                key={project.id}
                className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/20 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium">{project.title}</h3>
                  <Badge className="bg-green-500/10 text-green-500">{project.match} Match</Badge>
                </div>
                <p className="text-sm text-primary font-medium mb-2">{project.budget}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {project.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{project.posted}</span>
                  <span>{project.proposals} proposals</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/dashboard/freelancer/earnings">
          <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">View Earnings</p>
                <p className="text-xs text-muted-foreground">Check your wallet & transactions</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/freelancer/reputation">
          <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="font-medium">Build Reputation</p>
                <p className="text-xs text-muted-foreground">Check your on-chain ratings</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/freelancer/portfolio">
          <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Update Portfolio</p>
                <p className="text-xs text-muted-foreground">Showcase your best work</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
