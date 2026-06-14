'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { contractsApi } from '@/lib/api';
import type { Contract } from '@/types';
import { toast } from 'sonner';
import {
  FolderOpen,
  Clock,
  DollarSign,
  CheckCircle,
  ArrowUpRight,
  ExternalLink,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const milestoneStatusColors: Record<string, string> = {
  approved: 'bg-green-500/10 text-green-500',
  in_progress: 'bg-blue-500/10 text-blue-500',
  pending: 'bg-gray-500/10 text-gray-500',
  disputed: 'bg-red-500/10 text-red-500',
  submitted: 'bg-yellow-500/10 text-yellow-500',
  funded: 'bg-purple-500/10 text-purple-500',
  released: 'bg-green-500/10 text-green-500',
};

const contractStatusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-500',
  completed: 'bg-primary/10 text-primary',
  pending: 'bg-yellow-500/10 text-yellow-500',
  cancelled: 'bg-red-500/10 text-red-500',
  disputed: 'bg-red-500/10 text-red-500',
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const res = await contractsApi.list();
        setContracts(res.data.data);
      } catch {
        toast.error('Failed to load contracts');
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeContracts = contracts.filter(c => c.status === 'active');
  const totalInEscrow = activeContracts.reduce((sum, c) => sum + (c.total_amount - c.funded_amount), 0);
  const completedMilestones = contracts.reduce((sum, c) => 
    sum + (c.milestones?.filter(m => m.status === 'approved').length || 0), 0);

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
                <p className="text-2xl font-bold">{activeContracts.length}</p>
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
                <p className="text-2xl font-bold">${totalInEscrow.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">{completedMilestones}</p>
                <p className="text-xs text-muted-foreground">Milestones Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts */}
      <div className="space-y-4">
        {contracts.map((contract) => {
          const progress = contract.milestones?.length
            ? Math.round((contract.milestones.filter(m => m.status === 'approved').length / contract.milestones.length) * 100)
            : 0;
          
          return (
            <Card key={contract.id} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{contract.project?.title || 'Untitled Project'}</CardTitle>
                    <p className="text-sm text-muted-foreground">{contract.employer?.name || 'Unknown Employer'}</p>
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
                    <p className="font-semibold text-primary">${contract.total_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Funded</p>
                    <p className="font-semibold">${contract.funded_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Escrow</p>
                    <p className="font-mono text-xs flex items-center gap-1">
                      {contract.escrow_address ? `${contract.escrow_address.slice(0, 6)}...${contract.escrow_address.slice(-4)}` : 'N/A'}
                      <ExternalLink className="w-3 h-3" />
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="flex items-center gap-1 capitalize">
                      <Clock className="w-3 h-3" /> {contract.status}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Milestones */}
                {contract.milestones && contract.milestones.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Milestones</p>
                    {contract.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${milestone.status === 'approved' ? 'bg-green-500' : milestone.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-500'}`} />
                          <span className="text-sm">{milestone.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">${milestone.amount.toLocaleString()}</span>
                          <Badge className={milestoneStatusColors[milestone.status] || 'bg-gray-500/10 text-gray-500'}>
                            {milestone.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

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
          );
        })}
        {contracts.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No contracts found</p>
        )}
      </div>
    </div>
  );
}
