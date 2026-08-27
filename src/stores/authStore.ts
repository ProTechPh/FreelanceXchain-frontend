import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthSuccessResponse, User, UserRole } from '@/types';
import { authApi } from '@/lib/api';
import {
  isAuthSuccessResponse,
  isMfaRequiredResponse,
  normalizeAuthUser,
} from '@/lib/auth-contract';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaPending: boolean;
  mfaSessionToken: string | null;
  hasHydrated: boolean;
  login: (email: string, password: string) => Promise<{ mfaRequired?: boolean }>;
  register: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  completeMfa: (response: AuthSuccessResponse) => void;
  beginMfa: (mfaSessionToken: string) => void;
  clearMfa: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      mfaPending: false,
      mfaSessionToken: null,
      hasHydrated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true, mfaPending: false, mfaSessionToken: null });
        try {
          const { data } = await authApi.login({ email, password });

          if (isMfaRequiredResponse(data)) {
            set({ isLoading: false, mfaPending: true, mfaSessionToken: data.mfaSessionToken });
            return { mfaRequired: true };
          }

          if (!isAuthSuccessResponse(data)) {
            throw new Error('The server returned an invalid authentication response');
          }

          localStorage.setItem('access_token', data.accessToken);
          localStorage.setItem('refresh_token', data.refreshToken);
          set({
            user: normalizeAuthUser(data.user),
            isAuthenticated: true,
            isLoading: false,
            mfaPending: false,
            mfaSessionToken: null,
          });
          return {};
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, role: UserRole) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.register({ email, password, role });
          if (!isAuthSuccessResponse(data)) {
            throw new Error('The server returned an invalid registration response');
          }

          localStorage.setItem('access_token', data.accessToken);
          localStorage.setItem('refresh_token', data.refreshToken);
          set({ user: normalizeAuthUser(data.user), isAuthenticated: true, isLoading: false });
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
          set({ user: null, isAuthenticated: false, mfaPending: false, mfaSessionToken: null });
        }
      },

      loadUser: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          set({ isAuthenticated: false, user: null, isLoading: false });
          return;
        }

        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          set({ isLoading: true });
        }

        try {
          const { data } = await authApi.getMe();
          set({ user: normalizeAuthUser(data.user), isAuthenticated: true, isLoading: false });
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      completeMfa: (response: AuthSuccessResponse) => {
        localStorage.setItem('access_token', response.accessToken);
        localStorage.setItem('refresh_token', response.refreshToken);
        set({
          user: normalizeAuthUser(response.user),
          isAuthenticated: true,
          mfaPending: false,
          mfaSessionToken: null,
        });
      },

      beginMfa: (mfaSessionToken: string) => {
        set({
          isAuthenticated: false,
          mfaPending: true,
          mfaSessionToken,
        });
      },

      clearMfa: () => {
        set({ mfaPending: false, mfaSessionToken: null });
      },

      setUser: (user) => set({ user }),

      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
