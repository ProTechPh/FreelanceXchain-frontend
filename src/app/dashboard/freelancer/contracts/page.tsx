'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FolderOpen,
  Clock,
  DollarSign,
  CheckCircle,
  ArrowUpRight,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

const contracts = [
  {
    id: '1',
    project: 'E-commerce Platform Redesign',
    employer: 'TechCorp Inc.',
    totalAmount: '$3,200',
    fundedAmount: '$3,200',
    status: 'active',
    escrowAddress: '0x1234...5678',
    milestones: [
      { name: 'UI Components', status: 'completed', amount: '$800' },
      { name: 'Backend Integration', status: 'in_progress', amount: '$1,200' },
      { name: 'Testing & QA', status: 'pending', amount: '$800' },
      { name: 'Deployment', status: 'pending', amount: '$400' },
    ],
    deadline: 'Dec 20, 2024',
    progress: 35,
  },
  {
    id: '2',
    project: 'Mobile App Development',
    employer: 'StartupXYZ',
    totalAmount: '$5,500',
    fundedAmount: '$5,500',
    status: 'active',
    escrowAddress: '0xabcd...ef01',
    milestones: [
      { name: 'UI/UX Design', status: 'completed', amount: '$1,000' },
      { name: 'iOS Development', status: 'in_progress', amount: '$2,000' },
      { name: 'Android Development', status: 'pending', amount: '$1,500' },
      { name: 'API Integration', status: 'pending', amount: '$1,000' },
    ],
    deadline: 'Jan 15, 2025',
    progress: 25,
  },
  {
    id: '3',
    project: 'Smart Contract Audit',
    employer: 'DeFi Protocol',
    totalAmount: '$2,800',
    fundedAmount: '$2,800',
    status: 'completed',
    escrowAddress: '0x5678...9abc',
    milestones: [
      { name: 'Code Review', status: 'completed', amount: '$1,000' },
      { name: 'Security Analysis', status: 'completed', amount: '$1,000' },
      { name: 'Report Generation', status: 'completed', amount: '$800' },
    ],
    deadline: 'Dec 10, 2024',
    progress: 100,
  },
];

const milestoneStatusColors: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-500',
  in_progress: 'bg-blue-500/10 text-blue-500',
  pending: 'bg-gray-500/10 text-gray-500',
  disputed: 'bg-red-500/10 text-red-500',
};

const contractStatusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-500',
  completed: 'bg-primary/10 text-primary',
  pending: 'bg-yellow-500/10 text-yellow-500',
  cancelled: 'bg-red-500/10 text-red-500',
};

export default function ContractsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Contracts</h1>
          <p className="text-muted-foreground">Manage your active contracts and milestones</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-muted-foreground">Active Contracts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">$8,700</p>
                <p className="text-xs text-muted-foreground">In Escrow</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-xs text-muted-foreground">Milestones Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts */}
      <div className="space-y-4">
        {contracts.map((contract) => (
          <Card key={contract.id} className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{contract.project}</CardTitle>
                  <p className="text-sm text-muted-foreground">{contract.employer}</p>
                </div>
                <Badge className={contractStatusColors[contract.status]}>
                  {contract.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contract Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-primary">{contract.totalAmount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Funded</p>
                  <p className="font-semibold">{contract.fundedAmount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Escrow</p>
                  <p className="font-mono text-xs flex items-center gap-1">
                    {contract.escrowAddress}
                    <ExternalLink className="w-3 h-3" />
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Deadline</p>
                  <p className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {contract.deadline}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span>{contract.progress}%</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full transition-all"
                    style={{ width: `${contract.progress}%` }}
                  />
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Milestones</p>
                {contract.milestones.map((milestone, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${milestone.status === 'completed' ? 'bg-green-500' : milestone.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-500'}`} />
                      <span className="text-sm">{milestone.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{milestone.amount}</span>
                      <Badge className={milestoneStatusColors[milestone.status]}>
                        {milestone.status.replace('_', ' ')}
                      </Badge>
                      {milestone.status === 'in_progress' && (
                        <Button size="sm" className="gradient-primary text-white">
                          Submit
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" size="sm">
                  <ArrowUpRight className="w-4 h-4 mr-2" /> View Contract
                </Button>
                {contract.status === 'active' && (
                  <Button variant="outline" size="sm" className="text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/10">
                    <AlertCircle className="w-4 h-4 mr-2" /> Dispute
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
