'use client';

import { ArrowDownLeft, ArrowUpRight, ExternalLink, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ListSkeleton } from '@/components/dashboard/skeletons';
import { useContractPaymentHistory } from '@/hooks/use-payments';
import {
  getPaymentDirection,
  getPaymentTypeLabel,
  summarizePaymentHistory,
} from '@/lib/payment-history';
import { formatAmount, formatDateTime } from '@/lib/format';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { cn } from '@/lib/utils';

/**
 * The contract's money ledger, from `GET /payments/contracts/:id/history`.
 *
 * This is deliberately separate from the Transactions card: that one reads the
 * blockchain `transactions` collection, this one reads the `payments` ledger, and
 * the two do not hold the same rows. Labelling them distinctly stops the overlap
 * reading as duplicate data.
 */
export function ContractPaymentHistory({
  contractId,
  userId,
}: {
  contractId: string;
  userId: string;
}) {
  const { data, isPending, isError, error } = useContractPaymentHistory(contractId);

  const items = data?.items ?? [];
  const summary = summarizePaymentHistory(items, userId);
  // The totals are sums of these rows, so they must carry the rows' own currency —
  // formatting them as USD next to ETH rows would misstate the amount.
  const currency = items[0]?.currency ?? 'USD';

  return (
    <Card data-slot="contract-payment-ledger" className="bg-card border-border">
      <CardHeader>
        <CardTitle>Payment ledger</CardTitle>
        <p className="text-sm text-muted-foreground">
          Every money movement recorded against this contract.
        </p>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <ListSkeleton rows={3} />
        ) : isError ? (
          <EmptyState
            size="sm"
            icon={Receipt}
            title="Payment ledger unavailable"
            description={getApiErrorMessage(error, 'The payment ledger could not be loaded. Try again shortly.')}
          />
        ) : items.length === 0 ? (
          <EmptyState
            size="sm"
            icon={Receipt}
            title="No payments yet"
            description="Escrow deposits, milestone releases and refunds will appear here as they happen."
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <LedgerTotal label="Received" value={summary.totalIn} currency={currency} tone="success" />
              <LedgerTotal label="Paid" value={summary.totalOut} currency={currency} tone="muted" />
              <LedgerTotal label="Net" value={summary.net} currency={currency} tone={summary.net >= 0 ? 'success' : 'muted'} />
            </div>

            <ul className="divide-y divide-border">
              {items.map((record) => {
                const direction = getPaymentDirection(record, userId);
                const Icon = direction === 'in' ? ArrowDownLeft : ArrowUpRight;
                return (
                  <li key={record.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-start gap-3">
                      {direction === 'none' ? (
                        <span className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      ) : (
                        <Icon
                          aria-hidden="true"
                          className={cn(
                            'mt-0.5 size-4 shrink-0',
                            direction === 'in' ? 'text-success' : 'text-muted-foreground',
                          )}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{getPaymentTypeLabel(record.paymentType)}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(record.createdAt)}</p>
                        {record.txHash && (
                          <a
                            href={`https://etherscan.io/tx/${record.txHash}`}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <span className="font-mono">{record.txHash.slice(0, 10)}…</span>
                            <ExternalLink aria-hidden="true" className="size-3" />
                            <span className="sr-only">View transaction on Etherscan</span>
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={cn(
                          'text-sm font-medium tabular-nums',
                          direction === 'in' ? 'text-success' : 'text-foreground',
                        )}
                      >
                        {direction === 'in' ? '+' : direction === 'out' ? '−' : ''}
                        {formatAmount(record.amount, { currency: record.currency, fractionDigits: 4 })}
                      </span>
                      <StatusBadge status={record.status} domain="transaction" size="sm" />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LedgerTotal({
  label,
  value,
  currency,
  tone,
}: {
  label: string;
  value: number;
  currency: string;
  tone: 'success' | 'muted';
}) {
  return (
    <div data-slot="ledger-total" className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 text-lg font-bold tabular-nums',
          tone === 'success' ? 'text-success' : 'text-foreground',
        )}
      >
        {formatAmount(value, { currency, fractionDigits: 4 })}
      </p>
    </div>
  );
}
