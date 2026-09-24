'use client';

import { useState } from 'react';
import { Unlink, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { connectWallet, formatWalletAddress, type WalletConnection } from '@/lib/wallet';
import { disconnectMetaMaskSession, requestWalletProvider } from '@/lib/metamask';
import { reportFailure } from '@/lib/report-failure';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WalletSettingsCardProps {
  user: User | null;
  onUserUpdate: (user: User | null) => void;
}

export function WalletSettingsCard({ user, onUserUpdate }: WalletSettingsCardProps) {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [isDisconnectingWallet, setIsDisconnectingWallet] = useState(false);

  const connect = async () => {
    setIsConnectingWallet(true);
    try {
      const provider = await requestWalletProvider();
      const connection = await connectWallet(provider);
      const { data } = await authApi.updateWallet(connection.address);
      setWallet(connection);
      if (user) onUserUpdate({ ...user, walletAddress: data.walletAddress });
      toast.success('Wallet connected to your account.');
    } catch (error) {
      reportFailure(error, 'connect your wallet', { fundsUnchanged: true });
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const disconnectWalletAddress = async () => {
    setIsDisconnectingWallet(true);
    try {
      await authApi.disconnectWallet();
      await disconnectMetaMaskSession();
      setWallet(null);
      if (user) onUserUpdate({ ...user, walletAddress: '' });
      toast.success('Wallet disconnected successfully.');
    } catch (error) {
      reportFailure(error, 'disconnect your wallet', { fundsUnchanged: true });
    } finally {
      setIsDisconnectingWallet(false);
    }
  };

  const hasWalletConnected = Boolean(wallet?.address || user?.walletAddress);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="size-5" /> Payment wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">
            {wallet
              ? formatWalletAddress(wallet.address)
              : user?.walletAddress
                ? formatWalletAddress(user.walletAddress)
                : 'No wallet connected'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {wallet
              ? `${wallet.balance} native tokens · ${wallet.networkName}`
              : 'Used to associate blockchain payments and escrow transactions with your account.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasWalletConnected && (
            <Button
              variant="outline"
              onClick={disconnectWalletAddress}
              disabled={isDisconnectingWallet || isConnectingWallet}
              className="text-destructive hover:bg-destructive/10"
            >
              <Unlink className="size-4 mr-1.5" />
              {isDisconnectingWallet ? 'Disconnecting…' : 'Disconnect wallet'}
            </Button>
          )}
          <Button onClick={connect} disabled={isConnectingWallet || isDisconnectingWallet}>
            {isConnectingWallet ? 'Connecting…' : hasWalletConnected ? 'Replace wallet' : 'Connect wallet'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
