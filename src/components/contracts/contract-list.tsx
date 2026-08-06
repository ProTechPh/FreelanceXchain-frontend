'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CircleDollarSign, FileCheck2, FolderOpen, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { contractsApi } from '@/lib/api';
import { getContractDetailRoute } from '@/lib/contract-route';
import { getStatusColor } from '@/lib/status-styles';
import type { Contract, UserRole } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ContractList({ role }: { role: Extract<UserRole, 'employer' | 'freelancer'> }) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contractsApi.list({ limit: 50 })
      .then(({ data }) => setContracts(data.items))
      .catch(() => toast.error('Unable to load contracts.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center" role="status" aria-label="Loading contracts">
        <LoaderCircle className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const active = contracts.filter((contract) => contract.status === 'active').length;
  const totalValue = contracts.reduce((total, contract) => total + contract.totalAmount, 0);
  const completed = contracts.filter((contract) => contract.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contracts</h1>
        <p className="text-muted-foreground">Track funding, deliverables, approvals, and payment activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Active', value: active, icon: FolderOpen },
          { label: 'Total value', value: `$${totalValue.toLocaleString()}`, icon: CircleDollarSign },
          { label: 'Completed', value: completed, icon: FileCheck2 },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <stat.icon className="size-5" aria-hidden="true" />
              </div>
              <div><p className="text-xl font-bold">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {contracts.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No contracts yet.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => {
            const milestones = contract.milestones ?? [];
            const completedMilestones = milestones.filter((milestone) => ['approved', 'completed'].includes(milestone.status)).length;
            const progress = milestones.length ? Math.round((completedMilestones / milestones.length) * 100) : 0;
            const counterparty = role === 'employer'
              ? contract.freelancer?.name || 'Freelancer'
              : contract.employer?.name || contract.employer?.companyName || 'Employer';

            return (
              <Card key={contract.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-lg">{contract.project?.title || contract.title || 'Contract'}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">Working with {counterparty}</p>
                    </div>
                    <Badge className={getStatusColor(contract.status)}>{contract.status.replace('_', ' ')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    <div><p className="text-muted-foreground">Value</p><p className="font-semibold">${contract.totalAmount.toLocaleString()}</p></div>
                    <div><p className="text-muted-foreground">Milestones</p><p className="font-semibold">{completedMilestones}/{milestones.length}</p></div>
                    <div><p className="text-muted-foreground">Progress</p><p className="font-semibold">{progress}%</p></div>
                    <div><p className="text-muted-foreground">Created</p><p className="font-semibold">{new Date(contract.createdAt).toLocaleDateString()}</p></div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted" aria-label={`${progress}% complete`}>
                    <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                  <Button asChild variant="outline">
                    <Link href={getContractDetailRoute(role, contract.id)}>View contract</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
