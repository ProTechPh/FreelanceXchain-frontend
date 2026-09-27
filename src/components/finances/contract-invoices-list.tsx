'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Printer,
  Download,
  ExternalLink,
  Search,
  Filter,
  Receipt,
  FileCheck2,
} from 'lucide-react';
import { contractsApi } from '@/lib/api';
import { getContractDetailRoute } from '@/lib/contract-route';
import { StatusBadge } from '@/components/ui/status-badge';
import type { Contract, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatAmount, formatDate } from '@/lib/format';
import { ContractInvoiceDialog } from '@/components/contracts/contract-invoice-dialog';

interface ContractInvoicesListProps {
  role: Extract<UserRole, 'employer' | 'freelancer'>;
}

export function ContractInvoicesList({ role }: ContractInvoicesListProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await contractsApi.list({ limit: 50 });
      setContracts(data.items || []);
    } catch {
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchContracts();
  }, [fetchContracts]);

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const title = (contract.project?.title || contract.title || '').toLowerCase();
      const counterparty = (
        role === 'employer'
          ? contract.freelancer?.name || ''
          : contract.employer?.name || contract.employer?.companyName || ''
      ).toLowerCase();
      const invoiceId = `inv-${contract.id.slice(0, 8)}`.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || title.includes(query) || counterparty.includes(query) || invoiceId.includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && contract.status === 'active') ||
        (statusFilter === 'completed' && contract.status === 'completed');

      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchQuery, statusFilter, role]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="size-5 text-primary" />
                Invoices &amp; Statements of Work
              </CardTitle>
              <CardDescription>
                Tax-ready receipts, milestone accounting, and cryptographic Statements of Work for your contracts.
              </CardDescription>
            </div>

            {/* Quick status filters */}
            <div className="flex rounded-lg border border-border bg-muted/40 p-1 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({contracts.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  statusFilter === 'completed'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by project, client, or invoice ID (e.g. INV-1234)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Contracts / Invoices list */}
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <EmptyState
              size="sm"
              icon={Receipt}
              title={contracts.length === 0 ? 'No invoices or contracts yet' : 'No matching invoices found'}
              description={
                contracts.length === 0
                  ? role === 'employer'
                    ? 'When you accept a proposal and fund escrow, official invoices will appear here.'
                    : 'When clients accept your proposals and fund milestones, official receipts and Statements of Work will be generated here.'
                  : 'Try adjusting your search query or filter settings.'
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredContracts.map((contract) => {
                const invoiceId = `INV-${contract.id.slice(0, 8).toUpperCase()}`;
                const sowId = `SOW-${contract.id.slice(0, 8).toUpperCase()}`;
                const counterparty =
                  role === 'employer'
                    ? contract.freelancer?.name || 'Contractor'
                    : contract.employer?.name || contract.employer?.companyName || 'Client';
                const projectTitle = contract.project?.title || contract.title || 'Contract Agreement';

                return (
                  <div
                    key={contract.id}
                    className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">{invoiceId}</span>
                        <span className="text-muted-foreground text-xs">•</span>
                        <span className="font-mono text-xs text-muted-foreground">{sowId}</span>
                        <StatusBadge status={contract.status} domain="contract" />
                      </div>
                      <h4 className="font-semibold text-foreground truncate">{projectTitle}</h4>
                      <p className="text-xs text-muted-foreground">
                        {role === 'employer' ? 'Contractor' : 'Client'}: <span className="font-medium text-foreground">{counterparty}</span> • Created {formatDate(contract.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                      <div className="text-right sm:min-w-[120px]">
                        <p className="text-xs text-muted-foreground">Agreed Value</p>
                        <p className="text-base font-bold tabular-nums text-foreground">{formatAmount(contract.totalAmount)}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedContract(contract)}
                          className="gap-1.5"
                        >
                          <Printer className="size-3.5 text-primary" />
                          Invoice / SOW
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={getContractDetailRoute(role, contract.id)}>
                            <ExternalLink className="size-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Printable Invoice Dialog */}
      {selectedContract && (
        <ContractInvoiceDialog
          open={Boolean(selectedContract)}
          onOpenChange={(open) => {
            if (!open) setSelectedContract(null);
          }}
          contract={selectedContract}
          milestones={selectedContract.milestones ?? []}
        />
      )}
    </div>
  );
}
