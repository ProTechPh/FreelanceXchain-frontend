import { create } from 'zustand';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { formatWalletAddress } from '@/lib/wallet-utils';

// EIP-1193 surface the store relies on.
export type WalletProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, callback: (data: unknown) => void) => void;
  removeListener?: (event: string, callback: (data: unknown) => void) => void;
  disconnect?: () => Promise<void>;
};

export interface WalletSession {
  address: string;
  chainId: number;
  provider: WalletProvider;
}

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  provider: WalletProvider | null;
  /** Native balance in whole units (ETH/MATIC), or null while unknown. */
  balance: number | null;
  isLoadingBalance: boolean;
  setSession: (session: WalletSession) => void;
  clearSession: () => void;
}

const BALANCE_REFRESH_MS = 30_000;

// Side effects tied to the active session. Kept outside React so every
// component that reads the wallet shares one set of listeners and one poller,
// instead of each mounting its own copy.
let detachListeners: (() => void) | null = null;
let balanceTimer: ReturnType<typeof setInterval> | null = null;
let balanceErrorShown = false;

function stopSessionEffects() {
  detachListeners?.();
  detachListeners = null;
  if (balanceTimer) clearInterval(balanceTimer);
  balanceTimer = null;
  balanceErrorShown = false;
}

export const useWalletStore = create<WalletState>()((set, get) => {
  const fetchBalance = async () => {
    const { provider, address } = get();
    if (!provider || !address) return;
    set({ isLoadingBalance: true });
    try {
      const balanceHex = (await provider.request({ method: 'eth_getBalance', params: [address, 'latest'] })) as string;
      // Ignore a response that lands after the wallet was switched or dropped.
      if (get().address !== address) return;
      set({ balance: Number(BigInt(balanceHex)) / 1e18 });
      balanceErrorShown = false;
    } catch (error) {
      if (get().address !== address) return;
      set({ balance: null });
      // Report once per outage, not on every 30s refresh.
      if (!balanceErrorShown) {
        balanceErrorShown = true;
        const message = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to fetch balance: ${message}`, { id: 'wallet-balance' });
      }
    } finally {
      if (get().address === address) set({ isLoadingBalance: false });
    }
  };

  const handleAccountsChanged = (accounts: unknown) => {
    const next = Array.isArray(accounts) && typeof accounts[0] === 'string' ? accounts[0] : null;
    if (!next) {
      get().clearSession();
      return;
    }
    if (next.toLowerCase() === get().address?.toLowerCase()) return;

    // The server keeps one linked wallet per account and refuses to swap it
    // silently, so switching accounts in MetaMask must not write anything.
    // Drop the session and tell the user how to get back to a valid state.
    const linked = useAuthStore.getState().user?.walletAddress;
    get().clearSession();
    toast.warning(
      linked
        ? `MetaMask switched to a different account. Switch back to ${formatWalletAddress(linked)}, or disconnect it here before connecting another wallet.`
        : 'MetaMask switched accounts. Connect your wallet again to continue.',
      { id: 'wallet-account-changed', duration: 8000 },
    );
  };

  const handleChainChanged = (chainId: unknown) => {
    const next = typeof chainId === 'string' ? Number.parseInt(chainId, 16) : Number(chainId);
    set({ chainId: next });
    void fetchBalance();
  };

  return {
    address: null,
    chainId: null,
    isConnected: false,
    provider: null,
    balance: null,
    isLoadingBalance: false,

    setSession: ({ address, chainId, provider }) => {
      stopSessionEffects();
      set({ address, chainId, provider, isConnected: true, balance: null });

      provider.on?.('accountsChanged', handleAccountsChanged);
      provider.on?.('chainChanged', handleChainChanged);
      detachListeners = () => {
        provider.removeListener?.('accountsChanged', handleAccountsChanged);
        provider.removeListener?.('chainChanged', handleChainChanged);
      };

      void fetchBalance();
      balanceTimer = setInterval(() => void fetchBalance(), BALANCE_REFRESH_MS);
    },

    clearSession: () => {
      stopSessionEffects();
      set({ address: null, chainId: null, provider: null, isConnected: false, balance: null, isLoadingBalance: false });
    },
  };
});

// The session belongs to whoever is signed in. Drop it on logout or when a
// different account signs in, so it never carries over between users.
let sessionOwnerId = useAuthStore.getState().user?.id ?? null;
useAuthStore.subscribe((state) => {
  const nextId = state.user?.id ?? null;
  if (nextId === sessionOwnerId) return;
  sessionOwnerId = nextId;
  if (useWalletStore.getState().isConnected) useWalletStore.getState().clearSession();
});
