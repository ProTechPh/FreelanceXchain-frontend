'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, ExternalLink, Network, RefreshCw, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useWalletConnection } from '@/hooks/use-wallet-connection';

interface WalletBalanceCardProps {
  role?: 'freelancer' | 'employer';
  className?: string;
}

export function WalletBalanceCard({ role = 'employer', className = '' }: WalletBalanceCardProps) {
  const {
    walletAddress,
    isConnected,
    formattedAddress,
    balance,
    networkName,
    symbol,
    isLoadingBalance,
    refreshBalance,
    switchToGanacheNetwork,
  } = useWalletConnection();

  const [copied, setCopied] = useState(false);

  if (!isConnected) {
    return null;
  }

  const handleCopy = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success('Wallet address copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy address');
    }
  };

  const isEmployer = role === 'employer';
  const transactionsRoute = isEmployer
    ? '/dashboard/employer/transactions'
    : '/dashboard/freelancer/earnings';
  const isMainnet = networkName === 'Ethereum Mainnet';

  return (
    <Card className={`border-border bg-card shadow-xs ${className}`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground">Connected Payment Wallet</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-success-subtle px-1.5 py-0.5 text-3xs font-semibold text-success">
                  <span className="size-1.5 rounded-full bg-success animate-pulse" /> Active
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-foreground">{formattedAddress}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Copy wallet address"
                  title="Copy address"
                >
                  {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                </button>
                {networkName && (
                  <span className="text-2xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {networkName}
                  </span>
                )}
                {isMainnet && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-2xs px-2 border-primary/40 text-primary hover:bg-primary/10"
                    onClick={() => void switchToGanacheNetwork()}
                  >
                    <Network className="size-3 mr-1" /> Switch to Ganache (7545)
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
            <div className="text-left sm:text-right">
              <p className="text-3xs uppercase tracking-wider text-muted-foreground">On-Chain Balance</p>
              <div className="flex items-center gap-1.5">
                <p className="text-lg font-extrabold text-foreground">
                  {balance !== null ? `${balance} ${symbol}` : '—'}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-foreground"
                  disabled={isLoadingBalance}
                  onClick={() => void refreshBalance()}
                  title="Refresh balance"
                >
                  <RefreshCw className={`size-3 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href={transactionsRoute}>
                <span className="hidden sm:inline">Ledger</span>
                <ExternalLink className="size-3.5 sm:ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
