'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, ChevronDown, CircleDollarSign, ListFilter, ReceiptText, WalletCards, X } from 'lucide-react';
import { reportLoadFailure } from '@/lib/report-failure';
import { transactionsApi } from '@/lib/api';
import { getSignedTransactionAmount, getTransactionDetailRoute } from '@/lib/transaction-view';
import { useAuthStore } from '@/stores/authStore';
import type { Transaction, UserRole } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ListSkeleton } from '@/components/dashboard/skeletons';

type ParticipantRole = Extract<UserRole, 'employer' | 'freelancer'>;

const typeLabels: Record<string, string> = {
  escrow_release: 'Milestone release',
  escrow_deposit: 'Escrow deposit',
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  refund: 'Refund',
};

export function ParticipantTransactions({ role }: { role: ParticipantRole }) {
  const user = useAuthStore((state) => state.user);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // A ref, because the Retry handed to the toast has to re-run the same filters,
  // and a callback cannot reference itself.
  const loadRef = useRef<(type?: string, status?: string) => void>(() => {});

  const load = useCallback(async (type = '', status = '') => {
    setLoading(true);
    try {
      const { data } = await transactionsApi.list({
        limit: 100,
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
      });
      setTransactions(data.items);
    } catch (error) {
      reportLoadFailure(error, 'transactions', () => loadRef.current(type, status));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRef.current = (type, status) => void load(type, status);
  }, [load]);

  useEffect(() => {
    // The initial ledger page is loaded from the authenticated transaction endpoint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const totals = useMemo(() => {
    if (!user) return { incoming: 0, outgoing: 0, netThisMonth: 0 };
    const now = new Date();
    return transactions.reduce((summary, transaction) => {
      if (transaction.status !== 'completed') return summary;
      const signedAmount = getSignedTransactionAmount(transaction, user.id);
      if (signedAmount > 0) summary.incoming += signedAmount;
      if (signedAmount < 0) summary.outgoing += Math.abs(signedAmount);
      const createdAt = new Date(transaction.created_at);
      if (createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()) {
        summary.netThisMonth += signedAmount;
      }
      return summary;
    }, { incoming: 0, outgoing: 0, netThisMonth: 0 });
  }, [transactions, user]);

  const applyFilters = () => void load(typeFilter, statusFilter);
  const selectedFilterCount = Number(Boolean(typeFilter)) + Number(Boolean(statusFilter));
  const clearFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    void load();
  };
  const title = role === 'freelancer' ? 'Earnings and transactions' : 'Payments and transactions';

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h1><p className="text-muted-foreground">Review ledger entries recorded by contract payment workflows.</p></div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Completed incoming', value: totals.incoming, icon: ArrowDownLeft },
          { label: 'Completed outgoing', value: totals.outgoing, icon: ArrowUpRight },
          { label: 'Net this month', value: totals.netThisMonth, icon: WalletCards },
        ].map((stat) => (
          <Card key={stat.label}><CardContent className="flex items-center gap-3 p-4"><div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><stat.icon className="size-5" /></div><div><p className="text-xl font-bold">${stat.value.toLocaleString()}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div></CardContent></Card>
        ))}
      </div>

      <Card className="gap-0 py-0">
        <CardContent className="p-0">
          <form onSubmit={(event) => { event.preventDefault(); applyFilters(); }}>
            <div className="flex flex-col gap-3 border-b border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                  <ListFilter className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Filter transactions</h2>
                  <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
                    {selectedFilterCount === 0
                      ? 'Showing all transaction activity'
                      : `${selectedFilterCount} ${selectedFilterCount === 1 ? 'filter' : 'filters'} selected`}
                  </p>
                </div>
              </div>

              {selectedFilterCount > 0 && (
                <Button type="button" variant="ghost" size="sm" className="self-start sm:self-auto" disabled={loading} onClick={clearFilters}>
                  <X className="size-4" aria-hidden="true" />
                  Clear filters
                </Button>
              )}
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="transaction-type" className="text-xs font-semibold">Type</Label>
                <div className="relative">
                  <select
                    id="transaction-type"
                    className="h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm text-foreground transition-[border-color,box-shadow] duration-fast hover:border-foreground/30 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                  >
                    <option value="">All types</option>
                    {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="transaction-status" className="text-xs font-semibold">Status</Label>
                <div className="relative">
                  <select
                    id="transaction-status"
                    className="h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm text-foreground transition-[border-color,box-shadow] duration-fast hover:border-foreground/30 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                </div>
              </div>

              <Button type="submit" className="w-full sm:col-span-2 lg:col-span-1 lg:w-auto" disabled={loading}>
                <ListFilter className="size-4" aria-hidden="true" />
                Apply filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Transaction history</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <ListSkeleton rows={4} label="Loading transactions" />
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground"><CircleDollarSign className="size-10" /><p>No transactions match these filters.</p></div>
          ) : (
            <ul className="divide-y divide-border">
              {transactions.map((transaction) => {
                const signedAmount = user ? getSignedTransactionAmount(transaction, user.id) : 0;
                return (
                  <li key={transaction.id}>
                    <Link href={getTransactionDetailRoute(role, transaction.id)} className="flex flex-col gap-3 rounded-lg px-2 py-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-muted"><ReceiptText className="size-5 text-primary" /></div><div><p className="font-medium">{typeLabels[transaction.type] || transaction.type.replaceAll('_', ' ')}</p><p className="text-sm text-muted-foreground">{new Date(transaction.created_at).toLocaleString()}</p></div></div>
                      <div className="text-left sm:text-right"><p className={signedAmount > 0 ? 'font-semibold text-success' : 'font-semibold'}>{signedAmount > 0 ? '+' : signedAmount < 0 ? '−' : ''}${Math.abs(transaction.amount).toLocaleString()}</p><Badge variant="secondary">{transaction.status}</Badge></div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
