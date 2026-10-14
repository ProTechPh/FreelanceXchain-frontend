'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Coins, FolderOpen, FileText, Scale, Search, X } from 'lucide-react';
import { reportLoadFailure } from '@/lib/report-failure';
import { contractsApi } from '@/lib/api';
import { getContractDetailRoute } from '@/lib/contract-route';
import { StatusBadge } from '@/components/ui/status-badge';
import type { Contract, UserRole } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/dashboard/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatAmount, formatDate } from '@/lib/format';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { DataFreshness, useDataFreshness } from '@/components/ui/data-freshness';
import { ContractInvoiceDialog } from '@/components/contracts/contract-invoice-dialog';

type ContractFilterTab = 'all' | 'active' | 'completed' | 'resolved' | 'cancelled' | 'disputed';

export function ContractList({ role }: { role: Extract<UserRole, 'employer' | 'freelancer'> }) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedInvoiceContract, setSelectedInvoiceContract] = useState<Contract | null>(null);
  const [selectedTab, setSelectedTab] = useState<ContractFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fetchRef = useRef<() => void>(() => {});
  const { lastUpdated, isRefreshing, touch } = useDataFreshness();

  const fetchContracts = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(false);
    contractsApi.list({ limit: 50 })
      .then(({ data }) => {
        if (active) {
          setContracts(data.items);
          touch();
        }
      })
      .catch((err) => {
        if (active) {
          setError(true);
          reportLoadFailure(err, 'your contracts', () => fetchRef.current());
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [touch]);

  useEffect(() => {
    fetchRef.current = () => void fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    return fetchContracts();
  }, [fetchContracts]);

  const stats = useMemo(() => {
    const total = contracts.length;
    const active = contracts.filter((c) => c.status === 'active').length;
    const completed = contracts.filter((c) => c.status === 'completed').length;
    const resolved = contracts.filter((c) => c.status === 'resolved').length;
    const cancelled = contracts.filter((c) => c.status === 'cancelled').length;
    const disputed = contracts.filter((c) => c.status === 'disputed').length;
    const pending = contracts.filter((c) => c.status === 'pending').length;
    const totalValue = contracts.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    return { total, active, completed, resolved, cancelled, disputed, pending, totalValue };
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      if (selectedTab !== 'all' && contract.status !== selectedTab) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const title = (contract.project?.title || contract.title || '').toLowerCase();
      const counterparty = (
        role === 'employer'
          ? contract.freelancer?.name || ''
          : contract.employer?.name || contract.employer?.companyName || ''
      ).toLowerCase();
      const id = contract.id.toLowerCase();
      return title.includes(q) || counterparty.includes(q) || id.includes(q);
    });
  }, [contracts, selectedTab, searchQuery, role]);

  const handleRefresh = useCallback(async () => {
    let active = true;
    try {
      const { data } = await contractsApi.list({ limit: 50 });
      if (active) {
        setContracts(data.items);
        touch();
      }
    } finally {
      active = false;
    }
  }, [touch]);

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-0">
      <div className="space-y-6">
        <PageHeader
          title="Contracts"
          description="Track funding, deliverables, approvals, and payment activity."
          actions={!loading && !error && contracts.length > 0 ? (
            <DataFreshness
              lastUpdated={lastUpdated}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
              label="contracts"
              size="sm"
            />
          ) : undefined}
        />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : error ? (
        <EmptyState
          icon={FolderOpen}
          title="Failed to load contracts"
          description="We couldn't load your contracts at this time."
          action={<Button onClick={fetchContracts}>Retry</Button>}
        />
      ) : (
        <>
          {/* Categorized Filter Tabs, Total Value, and Search Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={selectedTab} onValueChange={(val) => setSelectedTab(val as typeof selectedTab)} className="w-full sm:w-auto">
              <TabsList className="bg-muted/70 p-1 rounded-xl flex-wrap h-auto">
                <TabsTrigger value="all" className="gap-1.5 text-xs">
                  All <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">{stats.total}</Badge>
                </TabsTrigger>
                <TabsTrigger value="active" className="gap-1.5 text-xs">
                  Active <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">{stats.active}</Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" className="gap-1.5 text-xs">
                  Completed <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">{stats.completed}</Badge>
                </TabsTrigger>
                <TabsTrigger value="resolved" className="gap-1.5 text-xs">
                  Resolved <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">{stats.resolved}</Badge>
                </TabsTrigger>
                {stats.disputed > 0 && (
                  <TabsTrigger value="disputed" className="gap-1.5 text-xs">
                    Disputed <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">{stats.disputed}</Badge>
                  </TabsTrigger>
                )}
                <TabsTrigger value="cancelled" className="gap-1.5 text-xs">
                  Cancelled <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">{stats.cancelled}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap items-center gap-2.5">
              {stats.totalValue > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
                  <Coins className="size-3.5 text-primary" />
                  <span>Total Value: <strong className="font-semibold text-foreground">{formatAmount(stats.totalValue, { currency: 'ETH' })}</strong></span>
                </div>
              )}

              {contracts.length > 0 && (
                <div className="relative w-full sm:w-64 shrink-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Filter by title, party, or ref..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 pr-8 text-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>


          {filteredContracts.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title={
                searchQuery
                  ? "No matching contracts"
                  : selectedTab === 'active'
                  ? "No active contracts"
                  : selectedTab === 'completed'
                  ? "No completed contracts"
                  : selectedTab === 'resolved'
                  ? "No resolved contracts"
                  : selectedTab === 'cancelled'
                  ? "No cancelled contracts"
                  : selectedTab === 'disputed'
                  ? "No disputed contracts"
                  : role === 'employer'
                  ? "No contracts yet"
                  : "No contracts yet"
              }
              description={
                searchQuery
                  ? `No contracts match "${searchQuery}". Try a different keyword.`
                  : selectedTab === 'active'
                  ? "You have no contracts currently in active development."
                  : selectedTab === 'completed'
                  ? "Contracts with all milestones approved will appear here."
                  : selectedTab === 'resolved'
                  ? "Contracts settled through dispute arbitration will appear here."
                  : selectedTab === 'cancelled'
                  ? "Cancelled contracts will appear here."
                  : selectedTab === 'disputed'
                  ? "Contracts currently undergoing dispute review will appear here."
                  : role === 'employer'
                  ? 'A contract is created when you accept a proposal. Review your open projects to get started.'
                  : 'A contract is created when an employer accepts your proposal. Keep applying to open projects.'
              }
              action={
                selectedTab === 'all' && !searchQuery ? (
                  <Button asChild>
                    <Link href={role === 'employer' ? '/dashboard/employer/projects' : '/dashboard/freelancer/projects'}>
                      {role === 'employer' ? 'View my projects' : 'Browse projects'}
                    </Link>
                  </Button>
                ) : searchQuery ? (
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>Clear search</Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setSelectedTab('all')}>View all contracts</Button>
                )
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredContracts.map((contract) => {
                const milestones = contract.milestones ?? [];
                const completedMilestones = milestones.filter((milestone) => ['approved', 'completed'].includes(milestone.status)).length;
                const progress = milestones.length ? Math.round((completedMilestones / milestones.length) * 100) : 0;
                const counterparty = role === 'employer'
                  ? contract.freelancer?.name || 'Freelancer'
                  : contract.employer?.name || contract.employer?.companyName || 'Employer';

                return (
                  <Card key={contract.id} className="overflow-hidden border-border bg-card shadow-sm transition-all hover:border-border/80">
                    {/* Category & Status Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-5 py-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={contract.status} domain="contract" />
                        <span className="text-muted-foreground">•</span>
                        <Badge variant="outline" className="font-medium text-xs border-border/80 bg-background/60">
                          {contract.status === 'active' && 'Category: Active • In Progress'}
                          {contract.status === 'completed' && 'Category: Completed & Settled'}
                          {contract.status === 'resolved' && 'Category: Resolved • Arbitration Final'}
                          {contract.status === 'cancelled' && 'Category: Cancelled • Contract Closed'}
                          {contract.status === 'disputed' && 'Category: In Dispute • Escrow Locked'}
                          {contract.status === 'pending' && 'Category: Pending Setup'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono">
                        <span>Ref: #{contract.id.slice(0, 8)}</span>
                        <span>•</span>
                        <span className="font-sans">Created {formatDate(contract.createdAt)}</span>
                      </div>
                    </div>

                    <CardHeader className="pb-3 pt-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle className="text-lg font-bold">
                            <Link
                              href={getContractDetailRoute(role, contract.id)}
                              className="hover:text-primary transition-colors hover:underline"
                            >
                              {contract.project?.title || contract.title || 'Contract'}
                            </Link>
                          </CardTitle>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Working with <strong className="font-medium text-foreground">{counterparty}</strong>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Button asChild variant="outline" size="sm">
                            <Link href={getContractDetailRoute(role, contract.id)}>View contract</Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedInvoiceContract(contract)}
                            className="gap-1.5 text-muted-foreground hover:text-foreground h-8"
                          >
                            <FileText className="size-4 text-primary" />
                            Invoice / SOW
                          </Button>
                          {(contract.status === 'disputed' || contract.status === 'resolved') && (
                            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-warning hover:text-foreground h-8">
                              <Link href={`/dashboard/${role}/disputes?contractId=${contract.id}`}>
                                <Scale className="size-4" />
                                Dispute case
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4 rounded-lg bg-muted/40 p-3.5 border border-border/60">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Value</p>
                          <p className="font-semibold tabular-nums text-foreground mt-0.5">
                            {formatAmount(contract.totalAmount, { currency: contract.currency || 'ETH' })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Milestones</p>
                          <p className="font-semibold text-foreground mt-0.5">{completedMilestones}/{milestones.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Progress</p>
                          <p className="font-semibold text-foreground mt-0.5">{progress}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Created Date</p>
                          <p className="font-semibold text-foreground mt-0.5">{formatDate(contract.createdAt)}</p>
                        </div>
                      </div>

                      <Progress value={progress} label={`Contract progress: ${progress}%`} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
      </div>

      {selectedInvoiceContract && (
        <ContractInvoiceDialog
          open={Boolean(selectedInvoiceContract)}
          onOpenChange={(open) => {
            if (!open) setSelectedInvoiceContract(null);
          }}
          contract={selectedInvoiceContract}
          milestones={selectedInvoiceContract.milestones ?? []}
        />
      )}
    </PullToRefresh>
  );
}
