'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import {
  connectWallet,
  formatWalletAddress,
  getWalletBalance,
  getNetworkSymbol,
  switchToGanache,
  type WalletConnection,
} from '@/lib/wallet';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { useAuthStore } from '@/stores/authStore';

export function useWalletConnection() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const walletAddress = user?.walletAddress || wallet?.address || null;
  const isConnected = Boolean(walletAddress);
  const formattedAddress = walletAddress ? formatWalletAddress(walletAddress) : null;
  const balance = wallet?.balance ?? null;
  const networkName = wallet?.networkName ?? null;
  const symbol = getNetworkSymbol(wallet?.chainId);

  const refreshBalance = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum || !walletAddress) return;

    setIsLoadingBalance(true);
    try {
      const data = await getWalletBalance(window.ethereum, walletAddress);
      setWallet(data);
    } catch {
      // Non-blocking background balance update
    } finally {
      setIsLoadingBalance(false);
    }
  }, [walletAddress]);

  // Initial balance load and account change listener
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum || !walletAddress) return;

    void refreshBalance();

    const handleAccountsChanged = (value: string | string[]) => {
      const accounts = Array.isArray(value) ? value : [value];
      const activeAccount = accounts[0];
      if (!activeAccount) {
        setWallet(null);
        if (user) setUser({ ...user, walletAddress: '' });
      } else if (activeAccount.toLowerCase() !== walletAddress.toLowerCase()) {
        void authApi.updateWallet(activeAccount).then(({ data }) => {
          if (user) setUser({ ...user, walletAddress: data.walletAddress });
          void refreshBalance();
        }).catch(() => {
          // Ignore
        });
      }
    };

    const handleChainChanged = () => {
      void refreshBalance();
    };

    const handleFocus = () => {
      void refreshBalance();
    };

    window.addEventListener('focus', handleFocus);
    window.ethereum.on?.('accountsChanged', handleAccountsChanged);
    window.ethereum.on?.('chainChanged', handleChainChanged);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [walletAddress, refreshBalance, user, setUser]);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined') return null;

    if (!window.ethereum) {
      toast.error('No EVM-compatible wallet detected. Please install MetaMask or another Web3 wallet.');
      return null;
    }

    setIsConnecting(true);
    try {
      const connection = await connectWallet(window.ethereum);
      const { data } = await authApi.updateWallet(connection.address);
      setWallet(connection);
      if (user) {
        setUser({ ...user, walletAddress: data.walletAddress });
      }
      toast.success(`Wallet connected: ${formatWalletAddress(connection.address)} (${connection.balance} ${getNetworkSymbol(connection.chainId)})`);
      return connection;
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, error instanceof Error ? error.message : 'Failed to connect wallet.')
      );
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [user, setUser]);

  const disconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      await authApi.disconnectWallet();
      setWallet(null);
      if (user) {
        setUser({ ...user, walletAddress: '' });
      }
      toast.success('Wallet disconnected successfully.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to disconnect wallet.'));
    } finally {
      setIsDisconnecting(false);
    }
  }, [user, setUser]);

  const switchToGanacheNetwork = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    try {
      await switchToGanache(window.ethereum);
      toast.success('Switched to Ganache Localhost 7545');
      await refreshBalance();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to switch network in MetaMask.'));
    }
  }, [refreshBalance]);

  return {
    user,
    wallet,
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
  };
}
