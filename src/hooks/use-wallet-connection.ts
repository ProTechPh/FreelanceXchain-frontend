'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { useAuthStore } from '@/stores/authStore';
import { useWalletStore, type WalletProvider } from '@/stores/walletStore';
import { formatWalletAddress, getNetworkSymbol, chainNames } from '@/lib/wallet-utils';
import {
  disconnectMetaMaskSession,
  getMetaMaskClient,
  hasInjectedProvider,
  requestWalletProvider,
  restoreWalletSession,
} from '@/lib/metamask';

export interface WalletConnection {
  address: string;
  chainId: number;
  networkName: string;
  balance: string;
}

// Shared across every component using the hook, so the header button, balance
// card and banner never race each other into duplicate connect/restore calls.
let connectInFlight = false;
let restoreInFlight: Promise<void> | null = null;

/**
 * Makes the next connect show MetaMask's account picker instead of silently
 * reusing the account the site was last permitted. Best effort: older wallets
 * do not implement wallet_revokePermissions.
 */
async function revokeInjectedPermissions(provider: WalletProvider | null) {
  if (!provider) return;
  try {
    await provider.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] });
  } catch {
    // Unsupported or already revoked
  }
}

function getWalletSyncErrorMessage(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status;
  const linked = useAuthStore.getState().user?.walletAddress;
  if (status === 409) {
    return linked
      ? `Your account is already linked to ${formatWalletAddress(linked)}. Disconnect it first, then connect the new wallet.`
      : 'This account already has a linked wallet. Disconnect it first, then connect the new wallet.';
  }
  if (status === 429) {
    return 'Too many wallet requests. Please wait a few minutes and try again.';
  }
  return getApiErrorMessage(error, 'We could not link this wallet to your account. Please try again.');
}

// Helper function to get user-friendly error message
function getWalletErrorMessage(error: unknown): { message: string; isUserRejected: boolean } {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = (error as { code?: number }).code;
  
  // MetaMask not installed
  if (errorMessage.includes('MetaMask not found') || 
      errorMessage.includes('No Ethereum provider')) {
    return {
      message: 'MetaMask is not installed. Please install MetaMask from metamask.io and refresh the page.',
      isUserRejected: false,
    };
  }
  
  // User rejected connection
  if (errorCode === 4001 || 
      errorMessage.includes('User rejected') || 
      errorMessage.includes('user rejected') ||
      errorMessage.includes('User denied') ||
      errorMessage.includes('user denied')) {
    return {
      message: 'You rejected the connection request. Please try again and approve the connection in MetaMask.',
      isUserRejected: true,
    };
  }
  
  // Already pending request
  if (errorCode === -32002 || 
      errorMessage.includes('already pending') || 
      errorMessage.includes('already processing') ||
      errorMessage.includes('Request of type wallet_requestPermissions')) {
    return {
      message: 'A connection request is already pending. Please check your MetaMask extension and approve or reject the existing request.',
      isUserRejected: false,
    };
  }
  
  // Network issues
  if (errorMessage.includes('network') || 
      errorMessage.includes('Network') ||
      errorMessage.includes('chain') ||
      errorMessage.includes('disconnected') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('Failed to fetch')) {
    return {
      message: 'Network connection issue. Please check your internet connection and try again.',
      isUserRejected: false,
    };
  }
  
  // No accounts
  if (errorMessage.includes('No accounts') || 
      errorMessage.includes('account not found')) {
    return {
      message: 'No wallet accounts found. Please create an account in MetaMask or unlock your wallet.',
      isUserRejected: false,
    };
  }
  
  // Wallet locked
  if (errorMessage.includes('wallet locked') || 
      errorMessage.includes('Wallet locked')) {
    return {
      message: 'Your wallet is locked. Please unlock MetaMask and try again.',
      isUserRejected: false,
    };
  }
  
  // Default error
  return {
    message: `Failed to connect: ${errorMessage}`,
    isUserRejected: false,
  };
}

export function useWalletConnection() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const address = useWalletStore((state) => state.address);
  const chainId = useWalletStore((state) => state.chainId);
  const isConnected = useWalletStore((state) => state.isConnected);
  const rawBalance = useWalletStore((state) => state.balance);
  const isLoadingBalance = useWalletStore((state) => state.isLoadingBalance);
  const setSession = useWalletStore((state) => state.setSession);
  const clearSession = useWalletStore((state) => state.clearSession);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const networkName = chainId ? (chainNames[chainId] ?? `Chain ${chainId}`) : null;
  const symbol = getNetworkSymbol(chainId);
  const formattedAddress = address ? formatWalletAddress(address) : null;
  const balance = rawBalance === null ? null : `${rawBalance.toFixed(4)} ${symbol || 'ETH'}`;

  // Start MetaMask Connect early on devices without an injected wallet (mobile browsers),
  // so tapping "Connect" can open the MetaMask app right away.
  useEffect(() => {
    if (typeof window === 'undefined' || hasInjectedProvider()) return;
    void getMetaMaskClient().catch(() => {
      // Surfaced when the user tries to connect
    });
  }, []);

  // Restore the wallet session after a page reload. Only reconnect when the wallet's account
  // matches the one saved on the user's profile, so a wallet disconnected in the app stays
  // disconnected even if MetaMask still permits the site.
  const savedWalletAddress = user?.walletAddress?.toLowerCase() || null;
  useEffect(() => {
    if (typeof window === 'undefined' || !savedWalletAddress || isConnected || restoreInFlight) return;

    // Remove the old serialized state; the provider object can't be stored.
    localStorage.removeItem('walletState');

    restoreInFlight = restoreWalletSession()
      .then((session) => {
        const current = useAuthStore.getState().user?.walletAddress?.toLowerCase();
        if (!session || session.address.toLowerCase() !== current || useWalletStore.getState().isConnected) return;
        setSession({ address: session.address, chainId: session.chainId, provider: session.provider as WalletProvider });
      })
      .finally(() => {
        restoreInFlight = null;
      });
  }, [savedWalletAddress, isConnected, setSession]);

  // Connect directly to MetaMask
  const connectMetaMask = useCallback(async () => {
    if (connectInFlight) {
      toast.info('A connection request is already in progress. Please wait.');
      return;
    }

    if (useWalletStore.getState().isConnected) {
      toast.info('Your wallet is already connected.');
      return;
    }

    connectInFlight = true;
    setIsConnecting(true);

    try {
      // Injected wallet on desktop / MetaMask in-app browser; MetaMask Connect
      // (deeplink into the mobile app, or QR code) everywhere else.
      const ethereum = (await requestWalletProvider()) as unknown as WalletProvider;

      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      // Get the current chain ID
      const chainIdHex = await ethereum.request({ method: 'eth_chainId' }) as string;
      const nextChainId = parseInt(chainIdHex, 16);
      const nextAddress = accounts[0];

      // Link on the server first; the wallet only counts as connected once the
      // account it is tied to accepts it.
      let linkedAddress: string;
      try {
        const { data } = await authApi.updateWallet(nextAddress);
        linkedAddress = data.walletAddress;
      } catch (error) {
        toast.error(getWalletSyncErrorMessage(error), { id: 'wallet-sync', duration: 8000 });
        return;
      }

      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        setUser({ ...currentUser, walletAddress: linkedAddress });
      }
      setSession({ address: nextAddress, chainId: nextChainId, provider: ethereum });

      toast.success('Wallet connected successfully', { id: 'wallet-sync' });
    } catch (error) {
      const { message, isUserRejected } = getWalletErrorMessage(error);

      if (isUserRejected) {
        toast.error(message);
      } else {
        toast.error(message, {
          duration: 6000,
        });
      }
    } finally {
      connectInFlight = false;
      setIsConnecting(false);
    }
  }, [setUser, setSession]);

  const connect = useCallback(async () => {
    // Direct MetaMask connection - no modal needed
    await connectMetaMask();
  }, [connectMetaMask]);

  const disconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      // Unlink on the server first: it can refuse (e.g. active contracts), and in
      // that case the wallet should stay connected here too.
      await authApi.disconnectWallet();
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        setUser({ ...currentUser, walletAddress: '' });
      }

      const activeProvider = useWalletStore.getState().provider;
      clearSession();

      if (activeProvider?.disconnect) {
        await activeProvider.disconnect().catch(() => undefined);
      }
      await disconnectMetaMaskSession();
      if (hasInjectedProvider()) {
        await revokeInjectedPermissions(activeProvider);
      }

      toast.success('Wallet disconnected successfully');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to disconnect wallet. Please try again.'));
    } finally {
      setIsDisconnecting(false);
    }
  }, [setUser, clearSession]);

  // Function to set wallet connection from external source
  const setWalletConnection = useCallback((nextAddress: string, nextChainId: number, nextProvider: unknown) => {
    setSession({ address: nextAddress, chainId: nextChainId, provider: nextProvider as WalletProvider });
  }, [setSession]);

  const refreshBalance = useCallback(async () => {
    // Balance is automatically refreshed by the store
    toast.info('Balance will refresh automatically');
  }, []);

  const switchToGanacheNetwork = useCallback(async () => {
    toast.info('Ganache network switching requires manual configuration');
  }, []);

  const closeConnectModal = useCallback(() => {
    setShowConnectModal(false);
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
    isConnected,
    formattedAddress,
    balance,
    networkName,
    symbol,
    isLoadingBalance,
    isConnecting,
    isDisconnecting,
    showConnectModal,
    connect,
    connectMetaMask,
    disconnect,
    setWalletConnection,
    refreshBalance,
    switchToGanacheNetwork,
    closeConnectModal,
  };
}
