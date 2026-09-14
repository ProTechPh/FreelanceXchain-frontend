'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import type { Dispute, Transaction, UserRole } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAmount, formatDateTime } from '@/lib/format';
import { getTransactionDetailRoute } from '@/lib/transaction-view';

type ParticipantRole = Extract<UserRole, 'employer' | 'freelancer'>;

interface ContractHistoryCardProps {
  contractId: string;
  role: ParticipantRole;
  transactions: Transaction[];
  disputes: Dispute[];
}

export function ContractHistoryCard({
  contractId,
  role,
  transactions,
  disputes,
}: ContractHistoryCardProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Blockchain transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions recorded.</p>
          ) : (
            <ul className="space-y-3">
              {transactions.map((transaction) => (
                <li key={transaction.id} className="border-b border-border pb-3 text-sm last:border-0">
                  <Link
                    href={getTransactionDetailRoute(role, transaction.id)}
                    className="flex items-center justify-between rounded-md outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div>
                      <p className="font-medium capitalize">{transaction.type.replaceAll('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(transaction.created_at)}</p>
                      {transaction.transaction_hash && (
                        <p className="max-w-[200px] truncate font-mono text-xs text-primary/80">
                          {transaction.transaction_hash.slice(0, 10)}…{transaction.transaction_hash.slice(-8)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p>{formatAmount(transaction.amount)}</p>
                      <Badge variant="secondary" className="capitalize">
                        {transaction.status}
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Disputes</CardTitle>
          <Button variant="destructive" size="sm" asChild>
            <Link href={`/dashboard/${role}/disputes?contractId=${contractId}`}>File Dispute</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {disputes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No disputes for this contract.</p>
          ) : (
            disputes.map((dispute) => (
              <Link
                key={dispute.id}
                href={`/dashboard/${role}/disputes/${dispute.id}`}
                className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:border-primary/30"
              >
                <AlertTriangle className="mt-0.5 size-4 text-warning" />
                <div>
                  <p className="font-medium">{dispute.reason}</p>
                  <p className="text-muted-foreground">{dispute.status.replace('_', ' ')}</p>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
