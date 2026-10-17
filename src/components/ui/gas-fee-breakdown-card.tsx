'use client';

import { Fuel, CheckCircle2 } from 'lucide-react';
import { useRealGasFee } from '@/hooks/use-real-gas-fee';

interface GasFeeBreakdownCardProps {
  proposedRateEth: number | string | null | undefined;
  variant: 'employer' | 'freelancer';
  className?: string;
  compact?: boolean;
}

export function GasFeeBreakdownCard({
  proposedRateEth,
  variant,
  className = '',
  compact = false,
}: GasFeeBreakdownCardProps) {
  const {
    gasPriceGwei,
    employerGasFormattedEth,
    employerGasFormattedPhp,
    freelancerGasFormattedEth,
    freelancerGasFormattedPhp,
    getEmployerCost,
    getFreelancerPayout,
    source,
  } = useRealGasFee();

  const employerCost = getEmployerCost(proposedRateEth);
  const freelancerPayout = getFreelancerPayout(proposedRateEth);

  if (variant === 'employer') {
    if (compact) {
      return (
        <div className={`flex flex-col gap-1 text-2xs ${className}`}>
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1">
              <Fuel className="size-3 text-primary" /> Network Gas Fee:
            </span>
            <span className="font-medium text-foreground">
              {employerGasFormattedEth} ({employerGasFormattedPhp})
            </span>
          </div>
          {employerCost && (
            <div className="flex items-center justify-between border-t border-border/50 pt-1 font-semibold text-primary">
              <span>Total with Gas:</span>
              <span>
                {employerCost.totalFormattedPhp} ({employerCost.totalFormattedEth})
              </span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={`rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs space-y-2.5 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Fuel className="size-3.5 text-primary" />
            Blockchain Network Gas Fee (Escrow)
          </span>
          <span className="text-2xs font-semibold text-primary">
            {employerGasFormattedEth} ({employerGasFormattedPhp})
          </span>
        </div>

        {employerCost ? (
          <div className="space-y-1.5 pt-1 border-t border-primary/10">
            <div className="flex justify-between text-2xs text-muted-foreground">
              <span>Agreed Freelancer Rate:</span>
              <span className="font-medium text-foreground">
                {employerCost.rateFormattedPhp} ({employerCost.rateFormattedEth})
              </span>
            </div>
            <div className="flex justify-between text-2xs text-muted-foreground">
              <span>Escrow Deployment & Funding Gas:</span>
              <span className="font-medium text-foreground">
                + {employerCost.gasFormattedPhp} ({employerCost.gasFormattedEth})
              </span>
            </div>
            <div className="flex justify-between text-xs font-bold text-primary border-t border-primary/20 pt-1.5">
              <span>Total Deposit Required:</span>
              <span>
                {employerCost.totalFormattedPhp} ({employerCost.totalFormattedEth})
              </span>
            </div>
          </div>
        ) : (
          <p className="text-2xs text-muted-foreground">
            Live blockchain gas fee required for smart contract deployment and locking funds on-chain: {employerGasFormattedEth} ({employerGasFormattedPhp}).
          </p>
        )}

        <div className="flex items-center justify-between text-3xs text-muted-foreground border-t border-primary/10 pt-1">
          <span className="flex items-center gap-1 text-success">
            <CheckCircle2 className="size-3 shrink-0" />
            Real network gas price: {gasPriceGwei.toFixed(1)} Gwei ({source === 'metamask' ? 'via Connected Wallet' : 'Live Node'})
          </span>
          <span>Paid to network validators</span>
        </div>
      </div>
    );
  }

  // Freelancer variant
  if (compact) {
    return (
      <div className={`flex flex-col gap-1 text-2xs ${className}`}>
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1">
            <Fuel className="size-3 text-primary" /> Claim Gas Fee:
          </span>
          <span className="font-medium text-foreground">
            {freelancerGasFormattedEth} ({freelancerGasFormattedPhp})
          </span>
        </div>
        {freelancerPayout && (
          <div className="flex items-center justify-between border-t border-border/50 pt-1 font-semibold text-success">
            <span>Net Payout:</span>
            <span>
              {freelancerPayout.netFormattedPhp} ({freelancerPayout.netFormattedEth})
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground flex items-center gap-1.5">
          <Fuel className="size-3.5 text-primary" />
          Blockchain Gas Fee & Net Take-Home
        </span>
        <span className="text-2xs font-semibold text-foreground">
          Claim Gas: {freelancerGasFormattedEth} ({freelancerGasFormattedPhp})
        </span>
      </div>

      {freelancerPayout ? (
        <div className="space-y-1.5 pt-1 border-t border-primary/10">
          <div className="flex justify-between text-2xs text-muted-foreground">
            <span>Proposed Rate:</span>
            <span className="font-medium text-foreground">
              {freelancerPayout.rateFormattedPhp} ({freelancerPayout.rateFormattedEth})
            </span>
          </div>
          <div className="flex justify-between text-2xs text-muted-foreground">
            <span>Milestone Claim Gas Fee:</span>
            <span className="font-medium text-foreground">
              - {freelancerPayout.gasFormattedPhp} ({freelancerPayout.gasFormattedEth})
            </span>
          </div>
          <div className="flex justify-between text-xs font-bold text-success border-t border-primary/20 pt-1.5">
            <span>Net Take-Home Payout:</span>
            <span>
              {freelancerPayout.netFormattedPhp} ({freelancerPayout.netFormattedEth})
            </span>
          </div>
        </div>
      ) : (
        <p className="text-2xs text-muted-foreground">
          Zero platform commission. When claiming milestone earnings, network gas fee is {freelancerGasFormattedEth} ({freelancerGasFormattedPhp}).
        </p>
      )}

      <div className="flex items-center justify-between text-3xs text-muted-foreground border-t border-primary/10 pt-1">
        <span className="flex items-center gap-1 text-success">
          <CheckCircle2 className="size-3 shrink-0" />
          Real network gas price: {gasPriceGwei.toFixed(1)} Gwei ({source === 'metamask' ? 'via Connected Wallet' : 'Live Node'})
        </span>
        <span>Employer pays escrow creation gas</span>
      </div>
    </div>
  );
}
