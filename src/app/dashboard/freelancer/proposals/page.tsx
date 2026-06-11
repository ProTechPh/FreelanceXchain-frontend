'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Send,
  ArrowUpRight,
  FileText,
} from 'lucide-react';

const proposals = {
  pending: [
    {
      id: '1',
      project: 'Blockchain Wallet Integration',
      employer: 'CryptoWallet Corp',
      amount: '$4,000',
      duration: '30 days',
      submitted: '2 hours ago',
      viewed: false,
    },
    {
      id: '2',
      project: 'DeFi Yield Optimizer',
      employer: 'YieldMax Protocol',
      amount: '$6,500',
      duration: '45 days',
      submitted: '1 day ago',
      viewed: true,
    },
  ],
  accepted: [
    {
      id: '3',
      project: 'E-commerce Platform Redesign',
      employer: 'TechCorp Inc.',
      amount: '$3,200',
      duration: '25 days',
      acceptedAt: 'Dec 1, 2024',
      contractId: 'c1',
    },
    {
      id: '4',
      project: 'Mobile App Development',
      employer: 'StartupXYZ',
      amount: '$5,500',
      duration: '60 days',
      acceptedAt: 'Nov 28, 2024',
      contractId: 'c2',
    },
  ],
  rejected: [
    {
      id: '5',
      project: 'NFT Game Development',
      employer: 'GameStudio',
      amount: '$12,000',
      duration: '90 days',
      rejectedAt: 'Nov 25, 2024',
      reason: 'Budget constraints',
    },
  ],
  withdrawn: [
    {
      id: '6',
      project: 'Token Launch Platform',
      employer: 'LaunchPad Inc.',
      amount: '$7,000',
      duration: '50 days',
      withdrawnAt: 'Nov 20, 2024',
    },
  ],
};

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  accepted: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  withdrawn: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

export default function ProposalsPage() {
  const [activeTab, setActiveTab] = useState('pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Proposals</h1>
          <p className="text-muted-foreground">Track and manage your submitted proposals</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(proposals).map(([status, items]) => {
          const config = statusConfig[status as keyof typeof statusConfig];
          return (
            <Card key={status} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <config.icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{items.length}</p>
                    <p className="text-xs text-muted-foreground capitalize">{status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({proposals.pending.length})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({proposals.accepted.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({proposals.rejected.length})</TabsTrigger>
          <TabsTrigger value="withdrawn">Withdrawn ({proposals.withdrawn.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {proposals.pending.map((proposal) => (
            <Card key={proposal.id} className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{proposal.project}</h3>
                    <p className="text-sm text-muted-foreground">{proposal.employer}</p>
                  </div>
                  <Badge className={statusConfig.pending.bg + ' ' + statusConfig.pending.color}>
                    {proposal.viewed ? 'Viewed' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="font-medium text-primary">{proposal.amount}</span>
                  <span>{proposal.duration}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {proposal.submitted}
                  </span>
                  {proposal.viewed && (
                    <span className="flex items-center gap-1 text-green-500">
                      <Eye className="w-3 h-3" /> Employer viewed
                    </span>
                  )}
                </div>
                <div className="mt-4 flex gap-3">
                  <Button variant="outline" size="sm">View Proposal</Button>
                  <Button variant="ghost" size="sm" className="text-destructive">Withdraw</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4">
          {proposals.accepted.map((proposal) => (
            <Card key={proposal.id} className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{proposal.project}</h3>
                    <p className="text-sm text-muted-foreground">{proposal.employer}</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-500">Accepted</Badge>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="font-medium text-primary">{proposal.amount}</span>
                  <span>{proposal.duration}</span>
                  <span>Accepted {proposal.acceptedAt}</span>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button className="gradient-primary text-white" size="sm">
                    <FileText className="w-4 h-4 mr-2" /> View Contract
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {proposals.rejected.map((proposal) => (
            <Card key={proposal.id} className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{proposal.project}</h3>
                    <p className="text-sm text-muted-foreground">{proposal.employer}</p>
                  </div>
                  <Badge className="bg-red-500/10 text-red-500">Rejected</Badge>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span>{proposal.amount}</span>
                  <span>{proposal.duration}</span>
                  <span>Rejected {proposal.rejectedAt}</span>
                  <span className="text-red-500">Reason: {proposal.reason}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="withdrawn" className="space-y-4">
          {proposals.withdrawn.map((proposal) => (
            <Card key={proposal.id} className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{proposal.project}</h3>
                    <p className="text-sm text-muted-foreground">{proposal.employer}</p>
                  </div>
                  <Badge className="bg-gray-500/10 text-gray-500">Withdrawn</Badge>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span>{proposal.amount}</span>
                  <span>{proposal.duration}</span>
                  <span>Withdrawn {proposal.withdrawnAt}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
