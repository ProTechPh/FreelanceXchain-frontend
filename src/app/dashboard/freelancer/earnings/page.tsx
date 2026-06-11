'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { useState } from 'react';

const transactions = [
  {
    id: '1',
    type: 'milestone_release',
    project: 'E-commerce Platform Redesign',
    amount: '$800',
    status: 'completed',
    date: 'Dec 1, 2024',
    txHash: '0xabc123...def456',
  },
  {
    id: '2',
    type: 'escrow_deposit',
    project: 'Mobile App Development',
    amount: '$5,500',
    status: 'completed',
    date: 'Nov 28, 2024',
    txHash: '0x789xyz...012abc',
  },
  {
    id: '3',
    type: 'milestone_release',
    project: 'Smart Contract Audit',
    amount: '$1,000',
    status: 'completed',
    date: 'Nov 25, 2024',
    txHash: '0x345def...678ghi',
  },
  {
    id: '4',
    type: 'milestone_release',
    project: 'Smart Contract Audit',
    amount: '$1,000',
    status: 'completed',
    date: 'Nov 20, 2024',
    txHash: '0x901jkl...234mno',
  },
  {
    id: '5',
    type: 'milestone_release',
    project: 'Smart Contract Audit',
    amount: '$800',
    status: 'completed',
    date: 'Nov 15, 2024',
    txHash: '0x567pqr...890stu',
  },
];

const typeLabels: Record<string, { label: string; color: string }> = {
  milestone_release: { label: 'Milestone Release', color: 'text-green-500' },
  escrow_deposit: { label: 'Escrow Deposit', color: 'text-blue-500' },
  refund: { label: 'Refund', color: 'text-yellow-500' },
};

export default function EarningsPage() {
  const [copied, setCopied] = useState(false);
  const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              <p className="text-4xl font-bold gradient-text">$12,450</p>
              <p className="text-sm text-muted-foreground mt-2">Available for withdrawal</p>
            </div>
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 p-3 rounded-lg bg-background/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Wallet Address</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm truncate">{walletAddress}</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
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
                <p className="text-2xl font-bold">$12,450</p>
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
                <p className="text-2xl font-bold">$2,100</p>
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
                <p className="text-2xl font-bold">5</p>
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
              const typeInfo = typeLabels[tx.type];
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-background flex items-center justify-center ${typeInfo.color}`}>
                      {tx.type === 'milestone_release' ? (
                        <ArrowDownRight className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{typeInfo.label}</p>
                      <p className="text-sm text-muted-foreground">{tx.project}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-500">{tx.amount}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{tx.date}</span>
                      <span className="font-mono">{tx.txHash}</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
