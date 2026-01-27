import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, FreelancerProfile, EmployerProfile, Notification, FreelancerProfileUpdate, EmployerProfileUpdate } from '../types';
import api from '../lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: 'freelancer' | 'employer', name?: string, walletAddress?: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // Clear any existing wallet connection before login
          useWalletStore.getState().disconnect();
          
          const result = await api.login({ email, password });
          set({ user: result.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, role: 'freelancer' | 'employer', name?: string, walletAddress?: string) => {
        set({ isLoading: true });
        try {
          const result = await api.register({ email, password, role, name, walletAddress });
          set({ user: result.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        api.logout();
        set({ user: null, isAuthenticated: false });
        
        // Clear wallet state on logout
        useWalletStore.getState().disconnect();
        
        // Clear profile state on logout
        useProfileStore.setState({ 
          freelancerProfile: null, 
          employerProfile: null 
        });
        
        // Clear notification state on logout
        useNotificationStore.setState({ 
          notifications: [], 
          unreadCount: 0 
        });
      },

      fetchCurrentUser: async () => {
        set({ isLoading: true });
        try {
          const { user } = await api.getCurrentUser();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

interface ProfileState {
  freelancerProfile: FreelancerProfile | null;
  employerProfile: EmployerProfile | null;
  isLoading: boolean;
  fetchFreelancerProfile: () => Promise<void>;
  fetchEmployerProfile: () => Promise<void>;
  updateFreelancerProfile: (data: Partial<FreelancerProfile>) => Promise<void>;
  updateEmployerProfile: (data: Partial<EmployerProfile>) => Promise<void>;
  addSkill: (skill: { name: string; yearsOfExperience: number }) => Promise<void>;
  removeSkill: (skillName: string) => Promise<void>;
}

export const useProfileStore = create<ProfileState>()((set) => ({
  freelancerProfile: null,
  employerProfile: null,
  isLoading: false,

  fetchFreelancerProfile: async () => {
    set({ isLoading: true });
    try {
      const profile = await api.getMyFreelancerProfile();
      set({ freelancerProfile: profile, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchEmployerProfile: async () => {
    set({ isLoading: true });
    try {
      const profile = await api.getMyEmployerProfile();
      set({ employerProfile: profile, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  updateFreelancerProfile: async (data) => {
    set({ isLoading: true });
    try {
      const profile = await api.updateFreelancerProfile(data as FreelancerProfileUpdate);
      set({ freelancerProfile: profile, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error('Failed to update profile');
    }
  },

  updateEmployerProfile: async (data) => {
    set({ isLoading: true });
    try {
      const profile = await api.updateEmployerProfile(data as EmployerProfileUpdate);
      set({ employerProfile: profile, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error('Failed to update profile');
    }
  },

  addSkill: async (skill: { name: string; yearsOfExperience: number }) => {
    set({ isLoading: true });
    try {
      const profile = await api.addSkill(skill);
      set({ freelancerProfile: profile, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error('Failed to add skill');
    }
  },

  removeSkill: async (skillName: string) => {
    set({ isLoading: true });
    try {
      const profile = await api.removeSkill(skillName);
      set({ freelancerProfile: profile, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error('Failed to remove skill');
    }
  },
}));

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const result = await api.getNotifications({ maxItemCount: 50 });
      set({ notifications: result.items, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { count } = await api.getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // Silently fail
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.markAsRead(id);
      const notifications = get().notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      set({ notifications, unreadCount: get().unreadCount - 1 });
    } catch {
      throw new Error('Failed to mark notification as read');
    }
  },

  markAllAsRead: async () => {
    try {
      await api.markAllAsRead();
      const notifications = get().notifications.map((n) => ({ ...n, isRead: true }));
      set({ notifications, unreadCount: 0 });
    } catch {
      throw new Error('Failed to mark all notifications as read');
    }
  },
}));

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string | null;
  chainId: number | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  updateBalance: () => Promise<void>;
}

// Sanitize error messages to avoid exposing internal details
function sanitizeWalletError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // User rejected the request
    if (message.includes('user rejected') || message.includes('user denied')) {
      return 'Connection request was cancelled';
    }
    
    // Already processing
    if (message.includes('already processing')) {
      return 'Please check your wallet for a pending request';
    }
    
    // Network errors
    if (message.includes('network') || message.includes('connection')) {
      return 'Network error. Please check your connection and try again';
    }
    
    // Chain/network mismatch
    if (message.includes('chain') || message.includes('network')) {
      return 'Please switch to the correct network in your wallet';
    }
    
    // Generic wallet error
    return 'Failed to connect wallet. Please try again';
  }
  
  return 'An unexpected error occurred';
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      address: null,
      isConnected: false,
      isConnecting: false,
      balance: null,
      chainId: null,
      error: null,

      connect: async () => {
        if (typeof window.ethereum === 'undefined') {
          set({ error: 'MetaMask is not installed. Please install it to continue.' });
          return;
        }

        set({ isConnecting: true, error: null }); // Clear previous errors
        try {
          const { ethers } = await import('ethers');
          const provider = new ethers.BrowserProvider(window.ethereum);
          await provider.send('eth_requestAccounts', []);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          const balance = await provider.getBalance(address);
          const network = await provider.getNetwork();
          
          set({
            address,
            isConnected: true,
            isConnecting: false,
            balance: ethers.formatEther(balance),
            chainId: Number(network.chainId),
            error: null, // Explicitly clear error on success
          });
        } catch (error) {
          const sanitizedError = sanitizeWalletError(error);
          set({
            isConnecting: false,
            error: sanitizedError
          });
          // Re-throw the error so the caller knows it failed
          throw new Error(sanitizedError);
        }
      },

      disconnect: () => {
        // Clear wallet state
        set({ address: null, isConnected: false, balance: null, chainId: null, error: null });
        
        // Clear from localStorage
        localStorage.removeItem('wallet-storage');
      },

      updateBalance: async () => {
        const { address } = get();
        if (!address || typeof window.ethereum === 'undefined') return;

        try {
          const { ethers } = await import('ethers');
          const provider = new ethers.BrowserProvider(window.ethereum);
          const balance = await provider.getBalance(address);
          set({ balance: ethers.formatEther(balance) });
        } catch {
          // Silently fail
        }
      },
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({ 
        address: state.address, 
        isConnected: state.isConnected,
        chainId: state.chainId,
      }),
    }
  )
);

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: true,
      toggle: () => {
        const newValue = !get().isDark;
        set({ isDark: newValue });
        if (newValue) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: import('ethers').Eip1193Provider;
  }
}
