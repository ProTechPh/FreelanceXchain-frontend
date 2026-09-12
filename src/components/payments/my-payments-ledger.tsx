'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMyPayments } from '@/hooks/use-payments';
import { getPaymentDirection, getPaymentTypeLabel } from '@/lib/payment-history';
import { getContractDetailRoute } from '@/lib/contract-route';
import { formatDateTime } from '@/lib/format';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

const PAGE_SIZE = 20;

/**
 * Every payment the user is a party to, across all contracts, from
 * `GET /payments/me`. Offset paging, because the endpoint takes limit/offset
 * rather than a cursor (limit must be 1-100, offset >= 0, or the API answers 400).
 */
export function MyPaymentsLedger({ role }: { role: Extract<UserRole, 'employer' | 'freelancer'> }) {
  const [offset, setOffset] = useState(0);
  const user = useAuthStore((state) => state.user);
  const { data, isPending, isError, error, isFetching, refetch } = useMyPayments(PAGE_SIZE, offset);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasMore = data?.hasMore ?? false;

  return (
    <Card data-slot="my-payments-ledger" className="bg-card border-border">
      <CardHeader>
        <CardTitle>Payment ledger</CardTitle>
        <p className="text-sm text-muted-foreground">
          {total > 0
            ? `${total} recorded payment${total === 1 ? '' : 's'} across all your contracts.`
            : 'Money movements across all your contracts.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        ) : isError ? (
          <EmptyState
            size="sm"
            icon={Receipt}
            title="Payments unavailable"
            description={getApiErrorMessage(error, 'Your payment ledger could not be loaded. Try again shortly.')}
            action={<Button size="sm" variant="outline" onClick={() => void refetch()}>Retry</Button>}
          />
        ) : items.length === 0 ? (
          <EmptyState
            size="sm"
            icon={Receipt}
            title={offset === 0 ? 'No payments yet' : 'No more payments'}
            description={
              offset === 0
                ? 'No payments yet. Payments will appear here once you complete projects.'
                : 'You have reached the end of the ledger.'
            }
          />
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((record) => {
                  const direction = user ? getPaymentDirection(record, user.id) : 'none';
                  const isFiat = ['USD', 'EUR', 'GBP'].includes(record.currency?.toUpperCase());
                  const fractionDigits = isFiat ? 2 : 4;
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="capitalize font-medium">
                        {record.paymentType.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/${role}/contracts/${record.contractId}`}
                          className="font-mono text-xs hover:underline hover:text-primary transition-colors truncate max-w-[140px] block"
                          title={record.contractId}
                        >
                          {record.contractId.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(record.createdAt)}</TableCell>
                      <TableCell>
                        <StatusBadge status={record.status} domain="transaction" size="sm" />
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right tabular-nums',
                          direction === 'in' ? 'text-success' : 'text-destructive',
                        )}
                      >
                        {direction === 'in' ? '+' : direction === 'out' ? '−' : ''}
                        {Number(record.amount).toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })} {record.currency}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {(offset > 0 || hasMore) && (
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0 || isFetching}
              onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              {offset + 1}–{offset + items.length} of {total}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore || isFetching}
              onClick={() => setOffset((current) => current + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
