'use client';

import React from 'react';
import { useEthPhpRate } from '@/hooks/use-eth-php-rate';

interface CryptoPriceDisplayProps {
  amount: number | string | null | undefined;
  symbol?: string;
  showPhp?: boolean;
  inline?: boolean;
  className?: string;
  ethClassName?: string;
  phpClassName?: string;
  fractionDigitsEth?: number;
  fractionDigitsPhp?: number;
}

export function CryptoPriceDisplay({
  amount,
  symbol = 'ETH',
  showPhp = true,
  inline = true,
  className = '',
  ethClassName = 'font-bold text-foreground',
  phpClassName = 'text-muted-foreground text-xs font-normal',
  fractionDigitsEth = 4,
  fractionDigitsPhp,
}: CryptoPriceDisplayProps) {
  const { formatEthToPhp } = useEthPhpRate();

  if (amount == null) {
    return <span className={className}>—</span>;
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(num)) {
    return <span className={className}>—</span>;
  }

  const ethFormatted = `${num.toLocaleString('en-US', {
    maximumFractionDigits: fractionDigitsEth,
  })} ${symbol}`;

  if (!showPhp || symbol !== 'ETH') {
    return <span className={`${ethClassName} ${className}`}>{ethFormatted}</span>;
  }

  const phpFormatted = formatEthToPhp(num, { fractionDigits: fractionDigitsPhp });

  if (inline) {
    return (
      <span className={`inline-flex flex-wrap items-baseline gap-1.5 ${className}`}>
        <span className={ethClassName}>{ethFormatted}</span>
        <span className={phpClassName}>
          (≈ {phpFormatted})
        </span>
      </span>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <span className={ethClassName}>{ethFormatted}</span>
      <span className={phpClassName}>≈ {phpFormatted}</span>
    </div>
  );
}
