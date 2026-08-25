'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Loader2, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';
import { transactionsApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { parseTransactionMetadata } from '@/lib/transaction-view';
import type { Transaction, UserRole } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ParticipantRole = Extract<UserRole, 'employer' | 'freelancer'>;

export function TransactionDetail({ transactionId, role }: { transactionId: string; role: ParticipantRole }) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    transactionsApi.get(transactionId)
      .then(({ data }) => setTransaction(data))
      .catch((error) => toast.error(getApiErrorMessage(error, 'Unable to load this transaction.')))
      .finally(() => setLoading(false));
  }, [transactionId]);

  if (loading) {
    return <div className="flex min-h-64 items-center justify-center" role="status" aria-label="Loading transaction"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }
  if (!transaction) {
    return <Card><CardContent className="py-12 text-center text-muted-foreground">Transaction unavailable.</CardContent></Card>;
  }

  const metadata = parseTransactionMetadata(transaction.metadata);
  const hash = transaction.transaction_hash;
  const backPath = role === 'freelancer' ? '/dashboard/freelancer/earnings' : '/dashboard/employer/transactions';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" className="-ml-3"><Link href={backPath}><ArrowLeft className="mr-2 size-4" />Back to transactions</Link></Button>
      <div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-extrabold tracking-tight text-foreground">Transaction detail</h1><p className="mt-1 font-mono text-xs text-muted-foreground">{transaction.id}</p></div><Badge variant="secondary">{transaction.status}</Badge></div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ReceiptText className="size-5" />Ledger entry</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div><p className="text-sm text-muted-foreground">Type</p><p className="font-medium capitalize">{transaction.type.replaceAll('_', ' ')}</p></div>
          <div><p className="text-sm text-muted-foreground">Amount</p><p className="text-xl font-semibold">${transaction.amount.toLocaleString()}</p></div>
          <div><p className="text-sm text-muted-foreground">Created</p><p>{new Date(transaction.created_at).toLocaleString()}</p></div>
          <div><p className="text-sm text-muted-foreground">Updated</p><p>{new Date(transaction.updated_at).toLocaleString()}</p></div>
          {transaction.contract_id && <div><p className="text-sm text-muted-foreground">Contract</p><Button asChild variant="link" className="h-auto p-0"><Link href={`/dashboard/${role}/contracts/${transaction.contract_id}`}>{transaction.contract_id}</Link></Button></div>}
          {transaction.milestone_id && <div><p className="text-sm text-muted-foreground">Milestone</p><p className="break-all font-mono text-xs">{transaction.milestone_id}</p></div>}
          {transaction.from_user_id && <div><p className="text-sm text-muted-foreground">From user</p><p className="break-all font-mono text-xs">{transaction.from_user_id}</p></div>}
          {transaction.to_user_id && <div><p className="text-sm text-muted-foreground">To user</p><p className="break-all font-mono text-xs">{transaction.to_user_id}</p></div>}
        </CardContent>
      </Card>

      {hash && (
        <Card><CardHeader><CardTitle>Blockchain transaction</CardTitle></CardHeader><CardContent className="flex items-center gap-2"><code className="min-w-0 flex-1 break-all rounded-md bg-muted p-3 text-xs">{hash}</code><Button type="button" size="icon" variant="outline" aria-label="Copy transaction hash" onClick={() => void navigator.clipboard.writeText(hash).then(() => toast.success('Transaction hash copied.'))}><Copy className="size-4" /></Button></CardContent></Card>
      )}

      {Object.keys(metadata).length > 0 && (
        <Card><CardHeader><CardTitle>Metadata</CardTitle></CardHeader><CardContent><dl className="space-y-3">{Object.entries(metadata).map(([key, value]) => <div key={key} className="grid gap-1 sm:grid-cols-[180px_1fr]"><dt className="text-sm text-muted-foreground">{key.replaceAll('_', ' ')}</dt><dd className="break-all text-sm">{typeof value === 'string' ? value : JSON.stringify(value)}</dd></div>)}</dl></CardContent></Card>
      )}
    </div>
  );
}
