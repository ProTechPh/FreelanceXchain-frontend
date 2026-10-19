'use client';

import { CheckCircle2, Fuel, Loader2 } from 'lucide-react';
import { useEthPhpRate } from '@/hooks/use-eth-php-rate';
import { formatAmount } from '@/lib/format';
import type { ActualTransactionGas, WalletGasQuote } from '@/lib/wallet';

interface GasFeeBreakdownCardProps {
  proposedRateEth: number | string | null | undefined;
  variant: 'employer' | 'freelancer';
  className?: string;
  compact?: boolean;
  milestoneCount?: number;
  liveDeploymentQuote?: WalletGasQuote | null;
  actualDeploymentGas?: ActualTransactionGas | null;
  quoteLoading?: boolean;
  quoteError?: string | null;
}

function positiveAmount(value: GasFeeBreakdownCardProps['proposedRateEth']): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function GasFeeBreakdownCard({
  proposedRateEth,
  variant,
  className = '',
  compact = false,
  milestoneCount = 1,
  liveDeploymentQuote,
  actualDeploymentGas,
  quoteLoading = false,
  quoteError,
}: GasFeeBreakdownCardProps) {
  const { formatEthToPhp } = useEthPhpRate();
  const agreedAmount = positiveAmount(proposedRateEth);
  const exactFee = actualDeploymentGas ? Number(actualDeploymentGas.feeEth) : null;
  const hasExactFee = exactFee !== null && Number.isFinite(exactFee);
  const quotedFee = hasExactFee ? exactFee : liveDeploymentQuote ? Number(liveDeploymentQuote.maxFeeEth) : null;
  const hasQuote = quotedFee !== null && Number.isFinite(quotedFee);
  const totalNeeded = agreedAmount !== null && hasQuote ? agreedAmount + quotedFee : null;

  if (variant === 'freelancer') {
    return (
      <div className={`${compact ? 'space-y-1 text-2xs' : 'space-y-2.5 rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs'} ${className}`}>
        <div className="flex items-start justify-between gap-3">
          <span className="flex items-center gap-1.5 font-semibold text-foreground">
            <Fuel className="size-3.5 shrink-0 text-primary" />
            Freelancer network fee
          </span>
          <span className="font-semibold text-success">Not deducted</span>
        </div>
        <p className="text-muted-foreground">
          The full agreed payout remains payable. Normal submissions are confirmed by the platform; a legacy escrow may ask for a wallet confirmation.
        </p>
        <p className="text-muted-foreground">
          If a wallet transaction is required, MetaMask shows its live fee before approval and the mined receipt records the exact fee paid.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`space-y-1.5 text-2xs ${className}`}>
        <div className="flex items-center justify-between gap-3 text-muted-foreground">
          <span className="flex items-center gap-1">
            <Fuel className="size-3 shrink-0 text-primary" /> Funding network fee:
          </span>
          <span className="text-right font-medium text-foreground">
            {quoteLoading ? (
              <span className="inline-flex items-center gap-1"><Loader2 className="size-3 animate-spin" /> Simulating…</span>
            ) : hasQuote ? (
              <>{hasExactFee ? 'Exact paid' : 'Up to'} {formatAmount(quotedFee, { currency: 'ETH', fractionDigits: 6 })} ({formatEthToPhp(quotedFee)})</>
            ) : (
              'Shown in wallet before approval'
            )}
          </span>
        </div>
        {totalNeeded !== null && (
          <div className="flex items-center justify-between border-t border-border/50 pt-1 font-semibold text-primary">
            <span>{hasExactFee ? 'Total actually spent:' : 'Max balance needed now:'}</span>
            <span>{formatAmount(totalNeeded, { currency: 'ETH', fractionDigits: 6 })}</span>
          </div>
        )}
        <p className="text-muted-foreground">
          {hasExactFee
            ? `Final mined receipt · ${Number(actualDeploymentGas!.gasUsed).toLocaleString('en-US')} gas units used`
            : hasQuote
              ? `Live wallet RPC simulation · ${Number(liveDeploymentQuote!.gasLimit).toLocaleString('en-US')} gas units`
            : quoteError || 'A real quote needs the final transaction details and connected contract network.'}
        </p>
        <p className="text-muted-foreground">
          Release fees for {milestoneCount} milestone{milestoneCount === 1 ? '' : 's'} are quoted separately by the wallet at each approval.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2.5 rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 font-semibold text-foreground">
          <Fuel className="size-3.5 text-primary" />
          Employer network fee
        </span>
        <span className="text-right font-semibold text-primary">
          {hasQuote ? `${hasExactFee ? 'Exact paid' : 'Up to'} ${formatAmount(quotedFee, { currency: 'ETH', fractionDigits: 6 })}` : 'Final fee in wallet'}
        </span>
      </div>

      {quoteLoading ? (
        <p className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Running a live wallet RPC simulation…</p>
      ) : hasQuote ? (
        <div className="space-y-1.5 border-t border-primary/10 pt-2">
          <div className="flex justify-between text-muted-foreground">
            <span>Agreed contract amount:</span>
            <span className="font-medium text-foreground">{formatAmount(agreedAmount ?? 0, { currency: 'ETH', fractionDigits: 6 })}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{hasExactFee ? 'Exact deployment fee paid:' : 'Live deployment maximum:'}</span>
            <span className="font-medium text-foreground">+ {formatAmount(quotedFee, { currency: 'ETH', fractionDigits: 6 })} ({formatEthToPhp(quotedFee)})</span>
          </div>
          {totalNeeded !== null && (
            <div className="flex justify-between border-t border-primary/20 pt-1.5 font-bold text-primary">
              <span>{hasExactFee ? 'Total actually spent:' : 'Maximum balance needed:'}</span>
              <span>{formatAmount(totalNeeded, { currency: 'ETH', fractionDigits: 6 })}</span>
            </div>
          )}
          <p className="text-3xs text-muted-foreground">
            {hasExactFee
              ? `Read from the final mined receipt (${Number(actualDeploymentGas!.gasUsed).toLocaleString('en-US')} gas units used).`
              : `Simulated now using the final deployment data and connected wallet network (${Number(liveDeploymentQuote!.gasLimit).toLocaleString('en-US')} gas units).`}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground">
          {quoteError || 'The contract does not have final deployable transaction data yet. MetaMask will show the live fee before approval.'}
        </p>
      )}

      <div className="flex items-start gap-1.5 border-t border-primary/10 pt-2 text-3xs text-muted-foreground">
        <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-success" />
        <span>
          {hasExactFee
            ? 'This is the exact deployment fee calculated from the mined receipt. Milestone-release fees are separate transactions.'
            : 'The wallet quote is live, not contractually fixed. The exact fee paid comes from the mined receipt; milestone-release fees are quoted separately at each approval.'}
        </span>
      </div>
    </div>
  );
}
