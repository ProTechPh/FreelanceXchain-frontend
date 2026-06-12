import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaPending: boolean;
  mfaAccessToken: string | null;
  login: (email: string, password: string) => Promise<{ mfaRequired?: boolean; accessToken?: string }>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  completeMfa: (user: User, accessToken: string) => void;
  clearMfa: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      mfaPending: false,
      mfaAccessToken: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.login({ email, password });
          
          // Check if MFA is required
          if (data.mfa_required && data.accessToken) {
            set({ isLoading: false, mfaPending: true, mfaAccessToken: data.accessToken });
            return { mfaRequired: true, accessToken: data.accessToken };
          }
          
          // Normal login success
          localStorage.setItem('access_token', data.access_token!);
          localStorage.setItem('refresh_token', data.refresh_token!);
          set({ user: data.user!, isAuthenticated: true, isLoading: false });
          return {};
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, name: string, role: UserRole) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.register({ email, password, name, role });
          localStorage.setItem('access_token', data.access_token!);
          localStorage.setItem('refresh_token', data.refresh_token!);
          set({ user: data.user!, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Ignore logout errors
        } finally {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          set({ user: null, isAuthenticated: false, mfaPending: false, mfaAccessToken: null });
        }
      },

      loadUser: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const { data } = await authApi.getMe();
          set({ user: data.data, isAuthenticated: true, isLoading: false });
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      completeMfa: (user: User, accessToken: string) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', accessToken);
        set({ user, isAuthenticated: true, mfaPending: false, mfaAccessToken: null });
      },

      clearMfa: () => {
        set({ mfaPending: false, mfaAccessToken: null });
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
