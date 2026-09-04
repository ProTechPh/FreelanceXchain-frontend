'use client';

import { ArrowRight, Loader2, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { HelpHint } from '@/components/onboarding/help-hint';

interface WalletConnectBannerProps {
  role?: 'freelancer' | 'employer';
  className?: string;
}

export function WalletConnectBanner({ role = 'freelancer', className = '' }: WalletConnectBannerProps) {
  const { isConnected, isConnecting, connect } = useWalletConnection();

  if (isConnected) {
    return null;
  }

  const isFreelancer = role === 'freelancer';

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-card to-secondary/60 p-4 sm:p-5 shadow-xs transition-all ${className}`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Wallet className="size-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">
                Connect your Web3 Wallet
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-2xs font-semibold text-primary">
                <Sparkles className="size-3" /> Recommended
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              {isFreelancer
                ? 'Link your Ethereum or Polygon wallet (e.g. MetaMask) to automatically receive milestone escrow payouts and build verified on-chain work history.'
                : 'Link your Web3 wallet (e.g. MetaMask) to fund project escrows securely, approve milestone payments, and manage on-chain contracts.'}
            </p>
            <HelpHint topic={isFreelancer ? 'wallet' : 'escrow'} className="pt-1" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center">
          <Button
            type="button"
            variant="gradient"
            onClick={() => void connect()}
            disabled={isConnecting}
            className="w-full sm:w-auto shadow-xs font-semibold"
          >
            {isConnecting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <Wallet className="size-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>
          <Button asChild variant="outline" size="default" className="w-full sm:w-auto">
            <Link href={`/dashboard/${role}/settings`}>
              Settings <ArrowRight className="size-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-2xs text-muted-foreground border-t border-border/40 pt-2.5">
        <ShieldCheck className="size-3.5 text-success" />
        <span>Supports MetaMask, Coinbase Wallet, Brave, and other EVM-compatible wallets. No gas fees required to link.</span>
      </div>
    </div>
  );
}
