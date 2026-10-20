'use client';

import { CheckCircle2, Fuel, Loader2 } from 'lucide-react';
import { useEthPhpRate } from '@/hooks/use-eth-php-rate';
import { useRealGasFee } from '@/hooks/use-real-gas-fee';
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
  const {
    gasPriceGwei,
    employerGasEth,
    employerGasFormattedEth,
    employerGasFormattedPhp,
    freelancerGasFormattedEth,
    freelancerGasFormattedPhp,
    getMilestoneActionCost,
  } = useRealGasFee();

  const agreedAmount = positiveAmount(proposedRateEth);
  const exactFee = actualDeploymentGas ? Number(actualDeploymentGas.feeEth) : null;
  const hasExactFee = exactFee !== null && Number.isFinite(exactFee);
  const liveFee = liveDeploymentQuote ? Number(liveDeploymentQuote.maxFeeEth) : null;
  const hasLiveQuote = liveFee !== null && Number.isFinite(liveFee);
  const quotedFee = hasExactFee ? exactFee : hasLiveQuote ? liveFee : null;
  const hasQuote = quotedFee !== null && Number.isFinite(quotedFee);

  // Fallback to real network gas benchmark when live wallet quote is not yet initialized
  const displayFeeEthFormatted = hasQuote
    ? formatAmount(quotedFee, { currency: 'ETH', fractionDigits: 6 })
    : (variant === 'employer' ? employerGasFormattedEth : freelancerGasFormattedEth);
  const displayFeePhpFormatted = hasQuote
    ? formatEthToPhp(quotedFee)
    : (variant === 'employer' ? employerGasFormattedPhp : freelancerGasFormattedPhp);

  const effectiveEmployerGas = hasQuote ? quotedFee : employerGasEth;
  const totalNeeded = agreedAmount !== null ? agreedAmount + (variant === 'employer' ? effectiveEmployerGas : 0) : null;
  const milestoneReleaseEstimate = getMilestoneActionCost('employer-release', 1);

  if (variant === 'freelancer') {
    const netPayout = agreedAmount !== null ? agreedAmount : 0;

    if (compact) {
      return (
        <div className={`space-y-1.5 text-2xs ${className}`}>
          <div className="flex items-center justify-between gap-3 text-muted-foreground">
            <span className="flex items-center gap-1 font-medium">
              <Fuel className="size-3 shrink-0 text-primary" /> Freelancer network fee:
            </span>
            <span className="text-right font-medium text-success">
              Not deducted · 0% platform fee
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border/50 pt-1 font-semibold text-success">
            <span>Net take-home payout:</span>
            <span>
              {formatAmount(netPayout, { currency: 'ETH', fractionDigits: 4 })}
              <span className="ml-1 text-2xs font-normal text-muted-foreground">({formatEthToPhp(netPayout)})</span>
            </span>
          </div>
          <p className="text-muted-foreground">
            Employer covers escrow creation gas (~{employerGasFormattedEth}). Optional direct on-chain claim gas is ~{freelancerGasFormattedEth} ({freelancerGasFormattedPhp}).
          </p>
        </div>
      );
    }

    return (
      <div className={`space-y-2.5 rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs ${className}`}>
        <div className="flex items-start justify-between gap-3">
          <span className="flex items-center gap-1.5 font-semibold text-foreground">
            <Fuel className="size-3.5 shrink-0 text-primary" />
            Freelancer network fee
          </span>
          <span className="font-semibold text-success">
            Not deducted (0% platform fee)
          </span>
        </div>

        <div className="space-y-1.5 border-t border-primary/10 pt-2">
          <div className="flex justify-between text-muted-foreground">
            <span>Agreed deliverable rate:</span>
            <span className="font-medium text-foreground">
              {formatAmount(agreedAmount ?? 0, { currency: 'ETH', fractionDigits: 6 })} ({formatEthToPhp(agreedAmount ?? 0)})
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Platform commission:</span>
            <span className="font-medium text-success">0 ETH (₱0.00)</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Escrow deployment & funding gas:</span>
            <span className="font-medium text-foreground">Covered by Employer (~{employerGasFormattedEth} / {employerGasFormattedPhp})</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Milestone on-chain claim gas (if using Web3 wallet):</span>
            <span className="font-medium text-muted-foreground">~{freelancerGasFormattedEth} ({freelancerGasFormattedPhp})</span>
          </div>
          <div className="flex justify-between border-t border-primary/20 pt-1.5 font-bold text-success">
            <span>Net take-home payout:</span>
            <span>
              {formatAmount(netPayout, { currency: 'ETH', fractionDigits: 6 })} ({formatEthToPhp(netPayout)})
            </span>
          </div>
        </div>

        <div className="flex items-start gap-1.5 border-t border-primary/10 pt-2 text-3xs text-muted-foreground">
          <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-success" />
          <span>
            The full agreed payout remains payable. Standard milestone submissions and releases are platform-confirmed without gas deductions. If claiming directly via smart contract, MetaMask quotes ~{freelancerGasFormattedEth} (~65,000 gas units) paid to validators.
          </span>
        </div>
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
              <>{hasExactFee ? 'Exact paid: ' : 'Up to '}{displayFeeEthFormatted} ({displayFeePhpFormatted})</>
            ) : (
              <>~{employerGasFormattedEth} ({employerGasFormattedPhp}) <span className="text-3xs font-semibold text-primary/80">(Live Network Quote)</span></>
            )}
          </span>
        </div>
        {totalNeeded !== null && (
          <div className="flex items-center justify-between border-t border-border/50 pt-1 font-semibold text-primary">
            <span>{hasExactFee ? 'Total actually spent:' : hasQuote ? 'Max balance needed now:' : 'Total deposit required (with gas):'}</span>
            <span>
              {formatAmount(totalNeeded, { currency: 'ETH', fractionDigits: 6 })}
              <span className="ml-1 text-2xs font-normal text-muted-foreground">({formatEthToPhp(totalNeeded)})</span>
            </span>
          </div>
        )}
        <p className="text-muted-foreground">
          {hasExactFee
            ? `Final mined receipt · ${Number(actualDeploymentGas!.gasUsed).toLocaleString('en-US')} gas units used`
            : hasQuote
              ? `Live wallet RPC simulation · ${Number(liveDeploymentQuote!.gasLimit).toLocaleString('en-US')} gas units`
              : quoteError || `Live pre-transaction quote · ~850,000 gas units @ ${gasPriceGwei.toFixed(1)} Gwei (via Node RPC)`}
        </p>
        <p className="text-muted-foreground">
          Release fees for {milestoneCount} milestone{milestoneCount === 1 ? '' : 's'} are quoted separately by the wallet at each approval (~{milestoneReleaseEstimate.gasFormattedEth}/milestone).
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
          {hasQuote
            ? `${hasExactFee ? 'Exact paid: ' : 'Up to '}${displayFeeEthFormatted} (${displayFeePhpFormatted})`
            : `~${employerGasFormattedEth} (${employerGasFormattedPhp})`}
        </span>
      </div>

      {quoteLoading ? (
        <p className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Running a live wallet RPC simulation…</p>
      ) : (
        <div className="space-y-1.5 border-t border-primary/10 pt-2">
          <div className="flex justify-between text-muted-foreground">
            <span>Agreed contract amount:</span>
            <span className="font-medium text-foreground">
              {formatAmount(agreedAmount ?? 0, { currency: 'ETH', fractionDigits: 6 })} ({formatEthToPhp(agreedAmount ?? 0)})
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{hasExactFee ? 'Exact deployment fee paid:' : hasQuote ? 'Live deployment maximum:' : 'Pre-transaction network gas fee:'}</span>
            <span className="font-medium text-foreground">
              + {displayFeeEthFormatted} ({displayFeePhpFormatted})
            </span>
          </div>
          {totalNeeded !== null && (
            <div className="flex justify-between border-t border-primary/20 pt-1.5 font-bold text-primary">
              <span>{hasExactFee ? 'Total actually spent:' : hasQuote ? 'Maximum balance needed:' : 'Total deposit required (with gas):'}</span>
              <span>
                {formatAmount(totalNeeded, { currency: 'ETH', fractionDigits: 6 })} ({formatEthToPhp(totalNeeded)})
              </span>
            </div>
          )}
          <p className="text-3xs text-muted-foreground">
            {hasExactFee
              ? `Read from the final mined receipt (${Number(actualDeploymentGas!.gasUsed).toLocaleString('en-US')} gas units used).`
              : hasQuote
                ? `Simulated now using the final deployment data and connected wallet network (${Number(liveDeploymentQuote!.gasLimit).toLocaleString('en-US')} gas units).`
                : quoteError || `Live pre-transaction quote · ~850,000 gas units @ ${gasPriceGwei.toFixed(1)} Gwei (queried directly via blockchain node RPC).`}
          </p>
        </div>
      )}

      <div className="flex items-start gap-1.5 border-t border-primary/10 pt-2 text-3xs text-muted-foreground">
        <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-success" />
        <span>
          {hasExactFee
            ? 'This is the exact deployment fee calculated from the mined receipt. Milestone-release fees are separate transactions.'
            : hasQuote
              ? 'The wallet quote is live, not contractually fixed. The exact fee paid comes from the mined receipt; milestone-release fees are quoted separately at each approval.'
              : `Gas fees are paid directly to blockchain validators to lock funds on-chain. Milestone releases are ~${milestoneReleaseEstimate.gasFormattedEth}/milestone quoted by MetaMask at each approval.`}
        </span>
      </div>
    </div>
  );
}
