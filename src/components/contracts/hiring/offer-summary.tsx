'use client';

import type { ContractOffer, ContractPartyRole } from '@/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { formatAmount, formatDate, formatDateTime } from '@/lib/format';
import { diffOffers, type OfferChange } from '@/lib/contract-terms';
import { cn } from '@/lib/utils';
import { GasFeeBreakdownCard } from '@/components/ui/gas-fee-breakdown-card';
import { useEthPhpRate } from '@/hooks/use-eth-php-rate';

function Changed({ changed, children }: { changed: boolean; children: React.ReactNode }) {
  return (
    <span className={cn(changed && 'rounded-sm bg-warning-subtle px-1 text-foreground')}>
      {children}
      {changed && <span className="sr-only"> (changed)</span>}
    </span>
  );
}

/** One offer: amounts, deadline and milestone table; changes vs. the previous offer are highlighted. */
export function OfferSummary({
  offer,
  previous,
  proposerLabel,
  compact = false,
  viewerRole,
}: {
  offer: ContractOffer;
  previous?: ContractOffer | null;
  proposerLabel: string;
  compact?: boolean;
  viewerRole: ContractPartyRole;
}) {
  const changes: Set<OfferChange> = diffOffers(previous ?? null, offer);
  const { formatEthToPhp } = useEthPhpRate();
  const eth = (value: number) => formatAmount(value, { currency: 'ETH' });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">Round {offer.round}</span>
          <span className="text-xs text-muted-foreground">by {proposerLabel} · {formatDateTime(offer.createdAt)}</span>
          {offer.isSeed && <Badge variant="outline">From the project posting</Badge>}
        </div>
        <StatusBadge status={offer.status} />
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Base</dt>
          <dd className="font-semibold"><Changed changed={changes.has('baseAmount')}>{formatEthToPhp(offer.baseAmount)}</Changed></dd>
          <dd className="text-2xs text-muted-foreground">{eth(offer.baseAmount)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Additional pay</dt>
          <dd className="font-semibold"><Changed changed={changes.has('additionalPay')}>{formatEthToPhp(offer.additionalPay)}</Changed></dd>
          <dd className="text-2xs text-muted-foreground">{eth(offer.additionalPay)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Rush fee</dt>
          <dd className="font-semibold">
            <Changed changed={changes.has('rush')}>
              {offer.isRush ? formatEthToPhp(offer.rushFee) : 'None'}
            </Changed>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Total</dt>
          <dd className="font-semibold text-primary">{formatEthToPhp(offer.totalAmount)}</dd>
          <dd className="text-2xs text-muted-foreground">{eth(offer.totalAmount)}</dd>
        </div>
        <div className="col-span-2 sm:col-span-4">
          <dt className="text-muted-foreground">Deadline</dt>
          <dd className="font-medium"><Changed changed={changes.has('deadline')}>{formatDate(offer.deadline)}</Changed></dd>
        </div>
      </dl>

      <GasFeeBreakdownCard
        proposedRateEth={offer.totalAmount}
        variant={viewerRole}
        milestoneCount={offer.milestones.length}
        compact
        className="rounded-lg border border-border bg-muted/40 p-3"
      />

      {!compact && (
        <div className={cn('overflow-x-auto rounded-lg border border-border', changes.has('milestones') && 'border-warning-border')}>
          <table className="w-full min-w-[28rem] text-sm">
            <caption className="sr-only">Milestones in round {offer.round}{changes.has('milestones') ? ' (changed)' : ''}</caption>
            <thead className="bg-muted text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">#</th>
                <th scope="col" className="px-3 py-2 font-medium">Milestone</th>
                <th scope="col" className="px-3 py-2 font-medium">Due</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {offer.milestones.map((m, i) => (
                <tr key={`${m.title}-${i}`} className="border-t border-border align-top">
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2">
                    <p className="font-medium">{m.title}</p>
                    {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{formatDate(m.dueDate)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <p className="font-semibold text-foreground">{formatEthToPhp(m.amount)}</p>
                    <p className="text-2xs text-muted-foreground">{eth(m.amount)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(offer.isSeed || offer.message) && (
        <p className="whitespace-pre-line rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          {/* The seed's stored note was written for the freelancer; show a neutral one to both sides. */}
          {offer.isSeed ? 'Starting terms created from the project posting and the freelancer\u2019s proposed rate.' : offer.message}
        </p>
      )}
    </div>
  );
}
