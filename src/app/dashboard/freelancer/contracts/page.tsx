'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { contractsApi } from '@/lib/api';
import type { Contract } from '@/types';
import { getStatusColor } from '@/lib/status-styles';
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

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const res = await contractsApi.list();
        setContracts(res.data.items);
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
  const totalInEscrow = activeContracts.reduce((sum, c) => {
    const released = (c.milestones ?? []).filter(m => m.status === 'approved').reduce((s, m) => s + m.amount, 0);
    return sum + (c.totalAmount - released);
  }, 0);
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
          const releasedAmount = (contract.milestones ?? [])
            .filter(m => m.status === 'approved')
            .reduce((sum, m) => sum + m.amount, 0);

          return (
            <Card key={contract.id} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{contract.project?.title || 'Untitled Project'}</CardTitle>
                    <p className="text-sm text-muted-foreground">{contract.employer?.name || 'Unknown Employer'}</p>
                  </div>
                  <Badge className={getStatusColor(contract.status)}>
                    {contract.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contract Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Amount</p>
                    <p className="font-semibold text-primary">${contract.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Released</p>
                    <p className="font-semibold">${releasedAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Escrow</p>
                    <p className="font-mono text-xs flex items-center gap-1">
                      {contract.escrowAddress ? `${contract.escrowAddress.slice(0, 6)}...${contract.escrowAddress.slice(-4)}` : 'N/A'}
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
                          <Badge className={getStatusColor(milestone.status)}>
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
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No contracts found</p>
          </div>
        )}
      </div>
    </div>
  );
}
