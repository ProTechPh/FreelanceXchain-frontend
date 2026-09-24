'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { reportFailure } from '@/lib/report-failure';
import { formatWalletAddress, getNetworkSymbol, chainNames } from '@/lib/wagmi-config';

export interface WalletConnection {
  address: string;
  chainId: number;
  networkName: string;
  balance: string;
}

// Detect if user is on mobile
function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Detect if MetaMask is installed
function isMetaMaskInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof window.ethereum !== 'undefined' && (window.ethereum as { isMetaMask?: boolean }).isMetaMask === true;
}

export function useWalletConnection() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // wagmi hooks
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address,
    query: { enabled: !!address },
  });
  const { switchChain } = useSwitchChain();

  // Format balance
  const balance = balanceData ? `${(Number(balanceData.value) / 10 ** balanceData.decimals).toFixed(4)}` : null;
  const networkName = chainId ? (chainNames[chainId] ?? `Chain ${chainId}`) : null;
  const symbol = getNetworkSymbol(chainId);
  const formattedAddress = address ? formatWalletAddress(address) : null;

  // Auto-sync wallet with backend when account changes
  useEffect(() => {
    if (!isConnected || !address || !user) return;

    // Only update if the wallet address is different
    if (user.walletAddress?.toLowerCase() !== address.toLowerCase()) {
      authApi.updateWallet(address).then(({ data }) => {
        setUser({ ...user, walletAddress: data.walletAddress });
      }).catch(() => {
        // Ignore errors, wallet connection still works
      });
    }
  }, [isConnected, address, user, setUser]);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined') return null;

    setIsConnecting(true);
    try {
      // Determine which connector to use
      let result;

      if (isMobile()) {
        // On mobile, prefer WalletConnect for deep linking to wallet apps
        // If MetaMask app browser is being used, injected should work
        if (isMetaMaskInstalled()) {
          // User is in MetaMask mobile browser
          result = await connectAsync({ connector: injected() });
        } else {
          // Use WalletConnect for mobile wallet apps
          result = await connectAsync({ connector: walletConnect({ showQrModal: true }) });
        }
      } else {
        // On desktop, try injected first (MetaMask extension)
        if (isMetaMaskInstalled()) {
          result = await connectAsync({ connector: injected() });
        } else {
          // Fall back to WalletConnect
          result = await connectAsync({ connector: walletConnect({ showQrModal: true }) });
        }
      }

      if (!result?.accounts[0]) {
        throw new Error('No wallet account was selected');
      }

      const walletAddress = result.accounts[0];
      const connection: WalletConnection = {
        address: walletAddress,
        chainId: result.chainId,
        networkName: chainNames[result.chainId] ?? `Chain ${result.chainId}`,
        balance: '0', // Will be updated by useBalance hook
      };

      // Sync with backend
      const { data } = await authApi.updateWallet(walletAddress);
      if (user) {
        setUser({ ...user, walletAddress: data.walletAddress });
      }

      toast.success(`Wallet connected: ${formatWalletAddress(walletAddress)}`);
      return connection;
    } catch (error) {
      reportFailure(error, 'connect your wallet', { fundsUnchanged: true });
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [connectAsync, user, setUser]);

  const disconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      await disconnectAsync();
      await authApi.disconnectWallet();
      if (user) {
        setUser({ ...user, walletAddress: '' });
      }
      toast.success('Wallet disconnected successfully');
    } catch (error) {
      reportFailure(error, 'disconnect your wallet', { fundsUnchanged: true });
    } finally {
      setIsDisconnecting(false);
    }
  }, [disconnectAsync, user, setUser]);

  const refreshBalance = useCallback(async () => {
    await refetchBalance();
  }, [refetchBalance]);

  const switchToGanacheNetwork = useCallback(async () => {
    // Ganache is not a standard chain, so we can't use switchChain
    // For now, show a message that Ganache requires manual configuration
    toast.info('Ganache network switching requires manual configuration');
  }, []);

  return {
    user,
    wallet: isConnected && address ? {
      address,
      chainId: chainId ?? 0,
      networkName: networkName ?? '',
      balance: balance ?? '0',
    } : null,
    walletAddress: address ?? user?.walletAddress ?? null,
    isConnected: isConnected || !!user?.walletAddress,
    formattedAddress,
    balance,
    networkName,
    symbol,
    isLoadingBalance: false,
    isConnecting,
    isDisconnecting,
    connect,
    disconnect,
    refreshBalance,
    switchToGanacheNetwork,
  };
}

