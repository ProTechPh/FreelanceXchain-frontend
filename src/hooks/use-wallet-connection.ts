'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { formatWalletAddress, getNetworkSymbol, chainNames } from '@/lib/wallet-utils';
import {
  disconnectMetaMaskSession,
  getMetaMaskClient,
  hasInjectedProvider,
  requestWalletProvider,
} from '@/lib/metamask';

// Simple wallet state - no wagmi required
type WalletState = {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  provider: unknown | null;
};

export interface WalletConnection {
  address: string;
  chainId: number;
  networkName: string;
  balance: string;
}

// Ethereum provider type
type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, callback: (data: unknown) => void) => void;
  removeListener?: (event: string, callback: (data: unknown) => void) => void;
  disconnect?: () => Promise<void>;
};

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

  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    provider: null,
  });
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Ref to track if a connection request is already in progress
  const isConnectingRef = useRef(false);

  const networkName = walletState.chainId ? (chainNames[walletState.chainId] ?? `Chain ${walletState.chainId}`) : null;
  const symbol = getNetworkSymbol(walletState.chainId);
  const formattedAddress = walletState.address ? formatWalletAddress(walletState.address) : null;

  // Start MetaMask Connect early on devices without an injected wallet (mobile browsers),
  // so tapping "Connect" can open the MetaMask app right away.
  useEffect(() => {
    if (typeof window === 'undefined' || hasInjectedProvider()) return;
    void getMetaMaskClient().catch(() => {
      // Surfaced when the user tries to connect
    });
  }, []);

  // Load wallet state from localStorage on mount - clear stale state first
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Clear any stale wallet state to prevent issues
    localStorage.removeItem('walletState');
    
    const saved = localStorage.getItem('walletState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWalletState(parsed);
      } catch {
        localStorage.removeItem('walletState');
      }
    }
  }, []);

  // Save wallet state to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (walletState.isConnected) {
      localStorage.setItem('walletState', JSON.stringify(walletState));
    } else {
      localStorage.removeItem('walletState');
    }
  }, [walletState]);

  // Listen for account/chain changes from the provider
  useEffect(() => {
    if (!walletState.provider || typeof window === 'undefined') return;

    const provider = walletState.provider as {
      on?: (event: string, callback: (data: unknown) => void) => void;
      removeListener?: (event: string, callback: (data: unknown) => void) => void;
    };

    const handleAccountsChanged = (accounts: unknown) => {
      const accountList = Array.isArray(accounts) ? accounts : [];
      if (accountList.length === 0) {
        // User disconnected
        setWalletState({
          address: null,
          chainId: null,
          isConnected: false,
          provider: null,
        });
        setBalance(null);
      } else {
        setWalletState(prev => ({
          ...prev,
          address: accountList[0] as string,
        }));
      }
    };

    const handleChainChanged = (chainId: unknown) => {
      const newChainId = typeof chainId === 'string' ? parseInt(chainId, 16) : (chainId as number);
      setWalletState(prev => ({
        ...prev,
        chainId: newChainId,
      }));
    };

    if (provider.on) {
      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (provider.removeListener) {
        provider.removeListener('accountsChanged', handleAccountsChanged);
        provider.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [walletState.provider]);

  // Fetch balance when connected
  useEffect(() => {
    if (!walletState.isConnected || !walletState.address || !walletState.provider) {
      setBalance(null);
      return;
    }

    const fetchBalance = async () => {
      setIsLoadingBalance(true);
      try {
        const provider = walletState.provider as {
          request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
        };
        
        if (provider.request) {
          const balanceHex = await provider.request({
            method: 'eth_getBalance',
            params: [walletState.address, 'latest'],
          }) as string;
          
          const balanceWei = BigInt(balanceHex);
          const balanceEth = Number(balanceWei) / 1e18;
          setBalance(`${balanceEth.toFixed(4)} ${symbol || 'ETH'}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to fetch balance: ${message}`);
        setBalance(null);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
    
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [walletState.isConnected, walletState.address, walletState.provider, symbol]);

  // Auto-sync wallet with backend when account changes
  useEffect(() => {
    if (!walletState.isConnected || !walletState.address || !user) return;

    // Only update if the wallet address is different
    if (user.walletAddress?.toLowerCase() !== walletState.address.toLowerCase()) {
      authApi.updateWallet(walletState.address).then(({ data }) => {
        setUser({ ...user, walletAddress: data.walletAddress });
      }).catch((error) => {
        const message = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to sync wallet with server: ${message}`);
      });
    }
  }, [walletState.isConnected, walletState.address, user, setUser]);

  // Connect directly to MetaMask
  const connectMetaMask = useCallback(async () => {
    // Check if already connecting
    if (isConnectingRef.current) {
      toast.info('A connection request is already in progress. Please wait.');
      return;
    }

    // Check if already connected
    if (walletState.isConnected) {
      toast.info('Your wallet is already connected.');
      return;
    }

    isConnectingRef.current = true;
    setIsConnecting(true);
    
    try {
      // Injected wallet on desktop / MetaMask in-app browser; MetaMask Connect
      // (deeplink into the mobile app, or QR code) everywhere else.
      const ethereum = (await requestWalletProvider()) as unknown as EthereumProvider;

      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      // Get the current chain ID
      const chainIdHex = await ethereum.request({ method: 'eth_chainId' }) as string;
      const chainId = parseInt(chainIdHex, 16);

      const address = accounts[0];
      
      setWalletState({
        address,
        chainId,
        isConnected: true,
        provider: ethereum,
      });

      // Sync with backend
      try {
        const { data } = await authApi.updateWallet(address);
        if (user) {
          setUser({ ...user, walletAddress: data.walletAddress });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        toast.warning(`Wallet connected locally, but failed to sync with server: ${message}`);
      }

      toast.success('Wallet connected successfully');
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
      isConnectingRef.current = false;
      setIsConnecting(false);
    }
  }, [user, setUser, walletState.isConnected]);

  const connect = useCallback(async () => {
    // Direct MetaMask connection - no modal needed
    await connectMetaMask();
  }, [connectMetaMask]);

  const disconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      // Disconnect from provider if it has disconnect method
      const provider = walletState.provider as { disconnect?: () => Promise<void> } | null;
      if (provider?.disconnect) {
        await provider.disconnect();
      }
      
      await disconnectMetaMaskSession();
      await authApi.disconnectWallet();
      if (user) {
        setUser({ ...user, walletAddress: '' });
      }
      
      setWalletState({
        address: null,
        chainId: null,
        isConnected: false,
        provider: null,
      });
      setBalance(null);
      
      toast.success('Wallet disconnected successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to disconnect wallet: ${message}`);
    } finally {
      setIsDisconnecting(false);
    }
  }, [walletState.provider, user, setUser]);

  // Function to set wallet connection from external source
  const setWalletConnection = useCallback((address: string, chainId: number, provider: unknown) => {
    setWalletState({
      address,
      chainId,
      isConnected: true,
      provider,
    });
  }, []);

  const refreshBalance = useCallback(async () => {
    // Balance is automatically refreshed by the effect
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
    wallet: walletState.isConnected && walletState.address ? {
      address: walletState.address,
      chainId: walletState.chainId ?? 0,
      networkName: networkName ?? '',
      balance: balance ?? '0',
    } : null,
    walletAddress: walletState.address ?? user?.walletAddress ?? null,
    isConnected: walletState.isConnected,
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
