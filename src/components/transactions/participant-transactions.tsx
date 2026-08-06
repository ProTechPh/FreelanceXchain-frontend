'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, Loader2, ReceiptText, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import { transactionsApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { getSignedTransactionAmount, getTransactionDetailRoute } from '@/lib/transaction-view';
import { useAuthStore } from '@/stores/authStore';
import type { Transaction, UserRole } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

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
      toast.error(getApiErrorMessage(error, 'Unable to load transactions.'));
    } finally {
      setLoading(false);
    }
  }, []);

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
  const title = role === 'freelancer' ? 'Earnings and transactions' : 'Payments and transactions';

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">{title}</h1><p className="text-muted-foreground">Review ledger entries recorded by contract payment workflows.</p></div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Completed incoming', value: totals.incoming, icon: ArrowDownLeft },
          { label: 'Completed outgoing', value: totals.outgoing, icon: ArrowUpRight },
          { label: 'Net this month', value: totals.netThisMonth, icon: WalletCards },
        ].map((stat) => (
          <Card key={stat.label}><CardContent className="flex items-center gap-3 p-4"><div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><stat.icon className="size-5" /></div><div><p className="text-xl font-bold">${stat.value.toLocaleString()}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-2"><Label htmlFor="transaction-type">Type</Label><select id="transaction-type" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">All types</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className="space-y-2"><Label htmlFor="transaction-status">Status</Label><select id="transaction-status" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option><option value="pending">Pending</option><option value="completed">Completed</option><option value="failed">Failed</option></select></div>
          <Button type="button" variant="outline" onClick={applyFilters}>Apply filters</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Transaction history</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex min-h-40 items-center justify-center" role="status" aria-label="Loading transactions"><Loader2 className="size-7 animate-spin text-primary" /></div>
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
                      <div className="text-left sm:text-right"><p className={signedAmount > 0 ? 'font-semibold text-green-500' : 'font-semibold'}>{signedAmount > 0 ? '+' : signedAmount < 0 ? '−' : ''}${Math.abs(transaction.amount).toLocaleString()}</p><Badge variant="secondary">{transaction.status}</Badge></div>
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
