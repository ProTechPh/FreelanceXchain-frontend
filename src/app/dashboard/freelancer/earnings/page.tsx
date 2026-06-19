'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { transactionsApi } from '@/lib/api';
import type { Transaction } from '@/types';
import { toast } from 'sonner';
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Loader2,
} from 'lucide-react';

const typeLabels: Record<string, { label: string; color: string }> = {
  escrow_release: { label: 'Milestone Release', color: 'text-green-500' },
  escrow_deposit: { label: 'Escrow Deposit', color: 'text-blue-500' },
  deposit: { label: 'Deposit', color: 'text-blue-500' },
  withdrawal: { label: 'Withdrawal', color: 'text-yellow-500' },
  refund: { label: 'Refund', color: 'text-yellow-500' },
};

export default function EarningsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await transactionsApi.list();
        setTransactions(res.data.data);
      } catch {
        toast.error('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const totalEarned = transactions
    .filter(t => t.type === 'escrow_release' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const thisMonth = transactions
    .filter(t => {
      const txDate = new Date(t.created_at);
      const now = new Date();
      return t.type === 'escrow_release' && 
             t.status === 'completed' &&
             txDate.getMonth() === now.getMonth() &&
             txDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-muted-foreground">Track your earnings and transaction history</p>
      </div>

      {/* Wallet Card */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
              <p className="text-4xl font-bold gradient-text">${totalEarned.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-2">Available for withdrawal</p>
            </div>
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <Button className="gradient-primary text-white">Withdraw</Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalEarned.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${thisMonth.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-cyan" />
              </div>
              <div>
                <p className="text-2xl font-bold">{transactions.length}</p>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((tx) => {
              const typeInfo = typeLabels[tx.type] || { label: tx.type, color: 'text-gray-500' };
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-background flex items-center justify-center ${typeInfo.color}`}>
                      {tx.type === 'escrow_release' || tx.type === 'deposit' ? (
                        <ArrowDownRight className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{typeInfo.label}</p>
                      <p className="text-sm text-muted-foreground">{tx.currency}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.type === 'escrow_release' || tx.type === 'deposit' ? 'text-green-500' : ''}`}>
                      {tx.type === 'escrow_release' || tx.type === 'deposit' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                      {tx.tx_hash && (
                        <span className="font-mono">{tx.tx_hash.slice(0, 10)}...</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {transactions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No transactions yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
