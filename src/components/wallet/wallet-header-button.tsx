'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, ChevronDown, Loader2, Network, RefreshCw, Settings, Unlink, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWalletConnection } from '@/hooks/use-wallet-connection';

export function WalletHeaderButton() {
  const router = useRouter();
  const {
    user,
    walletAddress,
    isConnected,
    formattedAddress,
    balance,
    networkName,
    symbol,
    isLoadingBalance,
    isConnecting,
    isDisconnecting,
    connect,
    disconnect,
    refreshBalance,
    switchToGanacheNetwork,
  } = useWalletConnection();

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success('Wallet address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy address');
    }
  };

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await refreshBalance();
    toast.success('Wallet balance refreshed');
  };

  const settingsRoute = user?.role ? `/dashboard/${user.role}/settings` : '/dashboard/freelancer/settings';
  const isMainnet = networkName === 'Ethereum Mainnet';

  if (!isConnected) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => void connect()}
        disabled={isConnecting}
        className="relative flex items-center gap-2 border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-medium shadow-xs transition-colors"
      >
        {isConnecting ? (
          <>
            <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
            <span className="hidden sm:inline">Connecting…</span>
          </>
        ) : (
          <>
            <Wallet className="size-4 text-primary" aria-hidden="true" />
            <span>Connect Wallet</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Wallet ${formattedAddress}`}
        className="flex items-center gap-2 rounded-md border border-border bg-secondary/80 hover:bg-secondary px-2.5 py-1.5 text-xs outline-none transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
      >
        {balance !== null && (
          <span className="hidden sm:inline-flex items-center font-semibold text-primary pr-2 border-r border-border font-sans">
            {balance} {symbol}
          </span>
        )}
        <span className="size-2 rounded-full bg-success shrink-0" aria-hidden="true" />
        <Wallet className="size-3.5 text-primary shrink-0" aria-hidden="true" />
        <span className="font-mono text-foreground">{formattedAddress}</span>
        <ChevronDown className="size-3 text-muted-foreground shrink-0" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2.5">
        <div className="px-2 py-1.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Connected Wallet</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-success-subtle px-1.5 py-0.5 text-3xs font-medium text-success">
              <span className="size-1.5 rounded-full bg-success" /> Active
            </span>
          </div>

          <p className="font-mono text-xs font-semibold text-foreground break-all select-all bg-muted/50 p-1.5 rounded-md border border-border/50">
            {walletAddress}
          </p>

          <div className="flex items-center justify-between rounded-lg bg-primary/5 p-2 border border-primary/15">
            <div>
              <p className="text-3xs uppercase tracking-wider text-muted-foreground">On-chain Balance</p>
              <p className="text-sm font-bold text-foreground">
                {balance !== null ? `${balance} ${symbol}` : '—'}
              </p>
              {networkName && (
                <p className="text-3xs text-muted-foreground">{networkName}</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              disabled={isLoadingBalance}
              onClick={handleRefresh}
              title="Refresh Balance"
            >
              <RefreshCw className={`size-3.5 ${isLoadingBalance ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {isMainnet && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => void switchToGanacheNetwork()}
              className="cursor-pointer text-primary focus:text-primary font-medium"
            >
              <Network className="size-4 mr-2 text-primary" />
              Switch to Ganache (7545)
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
          {copied ? (
            <Check className="size-4 mr-2 text-success" />
          ) : (
            <Copy className="size-4 mr-2 text-muted-foreground" />
          )}
          {copied ? 'Copied to Clipboard' : 'Copy Address'}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push(settingsRoute)} className="cursor-pointer flex items-center">
          <Settings className="size-4 mr-2 text-muted-foreground" />
          Wallet & Security Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => void disconnect()}
          disabled={isDisconnecting}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <Unlink className="size-4 mr-2" />
          {isDisconnecting ? 'Disconnecting…' : 'Disconnect Wallet'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
