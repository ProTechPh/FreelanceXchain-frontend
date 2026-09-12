import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthSuccessResponse, User, UserRole } from '@/types';
import { authApi } from '@/lib/api';
import {
  isAuthSuccessResponse,
  isMfaRequiredResponse,
  normalizeAuthUser,
} from '@/lib/auth-contract';
import {
  getAccessToken,
  setAccessToken as setTokenStorage,
  clearAccessToken as clearTokenStorage,
} from '@/lib/auth-token';
import { getKycReminderStorageKey } from '@/lib/first-login-kyc';
import { registerPlanDesyncHandler } from '@/lib/plan-sync';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaPending: boolean;
  mfaSessionToken: string | null;
  hasHydrated: boolean;
  /**
   * True once this page load has confirmed the session against the server.
   *
   * Deliberately NOT persisted, so it is false on every page load by
   * construction — there is no way to persist a "trust me" bit. The plan we
   * rehydrate from localStorage is a display hint, never an entitlement
   * decision, and gates render a skeleton until this flips.
   */
  sessionVerified: boolean;
  login: (email: string, password: string, turnstileToken?: string) => Promise<{ mfaRequired?: boolean }>;
  register: (email: string, password: string, role: UserRole, turnstileToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  completeMfa: (response: AuthSuccessResponse) => void;
  beginMfa: (mfaSessionToken: string) => void;
  clearMfa: () => void;
  setHasHydrated: (value: boolean) => void;
  /** Re-read the plan from /auth/me without blanking the UI. */
  refreshPlan: () => Promise<void>;
}

function beginKycReminderSession(userId: string) {
  sessionStorage.removeItem(getKycReminderStorageKey(userId));
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      mfaPending: false,
      mfaSessionToken: null,
      hasHydrated: false,
      sessionVerified: false,

      login: async (email: string, password: string, turnstileToken?: string) => {
        set({ isLoading: true, mfaPending: false, mfaSessionToken: null });
        try {
          const { data } = await authApi.login({
            email,
            password,
            ...(turnstileToken && { 'cf-turnstile-response': turnstileToken }),
          });

          if (isMfaRequiredResponse(data)) {
            set({ isLoading: false, mfaPending: true, mfaSessionToken: data.mfaSessionToken });
            return { mfaRequired: true };
          }

          if (!isAuthSuccessResponse(data)) {
            throw new Error('The server returned an invalid authentication response');
          }

          setTokenStorage(data.accessToken);
          beginKycReminderSession(data.user.id);
          set({
            user: normalizeAuthUser(data.user),
            accessToken: data.accessToken,
            isAuthenticated: true,
            isLoading: false,
            mfaPending: false,
            mfaSessionToken: null,
            sessionVerified: true,
          });
          return {};
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, role: UserRole, turnstileToken?: string) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.register({
            email,
            password,
            role,
            ...(turnstileToken && { 'cf-turnstile-response': turnstileToken }),
          });
          if (!isAuthSuccessResponse(data)) {
            throw new Error('The server returned an invalid registration response');
          }

          setTokenStorage(data.accessToken);
          beginKycReminderSession(data.user.id);
          set({
            user: normalizeAuthUser(data.user),
            accessToken: data.accessToken,
            isAuthenticated: true,
            isLoading: false,
            sessionVerified: true,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        const userId = useAuthStore.getState().user?.id;
        try {
          await authApi.logout();
        } catch {
          // Ignore logout errors
        } finally {
          clearTokenStorage();
          if (userId) sessionStorage.removeItem(getKycReminderStorageKey(userId));
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            mfaPending: false,
            mfaSessionToken: null,
            sessionVerified: false,
          });
        }
      },

      loadUser: async () => {
        const hasToken = !!getAccessToken();
        const wasAuthenticated = useAuthStore.getState().isAuthenticated;

        if (!hasToken && !wasAuthenticated) {
          set({ isAuthenticated: false, user: null, accessToken: null, isLoading: false, sessionVerified: false });
          return;
        }

        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          set({ isLoading: true });
        }

        try {
          const { data } = await authApi.getMe();
          const token = getAccessToken();
          set({
            user: normalizeAuthUser(data.user),
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
            sessionVerified: true,
          });
        } catch {
          try {
            const currentToken = getAccessToken();
            const { data: refreshData } = await authApi.refreshToken(currentToken ?? undefined);
            if (isAuthSuccessResponse(refreshData)) {
              setTokenStorage(refreshData.accessToken);
              set({
                user: normalizeAuthUser(refreshData.user),
                accessToken: refreshData.accessToken,
                isAuthenticated: true,
                isLoading: false,
                sessionVerified: true,
              });
              return;
            }
          } catch {
            // Refresh also failed
          }

          clearTokenStorage();
          set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false, sessionVerified: false });
        }
      },

      completeMfa: (response: AuthSuccessResponse) => {
        setTokenStorage(response.accessToken);
        beginKycReminderSession(response.user.id);
        set({
          user: normalizeAuthUser(response.user),
          accessToken: response.accessToken,
          isAuthenticated: true,
          mfaPending: false,
          mfaSessionToken: null,
          sessionVerified: true,
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

      setAccessToken: (token) => {
        setTokenStorage(token);
        set({ accessToken: token });
      },

      /**
       * Re-read the plan after an upgrade, a portal visit, or a 403 desync.
       *
       * Deliberately does NOT touch isLoading: DashboardLayout unmounts its
       * children while loading, so flipping it here would blank the dashboard
       * every time we resync. A failure is a no-op — the server-side gate is
       * the real enforcement point, this only keeps the UI honest.
       */
      refreshPlan: async () => {
        if (!getAccessToken() && !useAuthStore.getState().isAuthenticated) return;

        try {
          const { data } = await authApi.getMe();
          const fresh = normalizeAuthUser(data.user);
          set((state) => ({
            user: state.user ? { ...state.user, plan: fresh.plan, planStatus: fresh.planStatus } : fresh,
            sessionVerified: true,
          }));
        } catch {
          // Leave the current plan in place; the gate still fails closed server-side.
        }
      },

      setHasHydrated: (value: boolean) => set((state) => ({
        hasHydrated: value,
        // A persisted user is only a hint that a session existed. Keep protected
        // UI unmounted until loadUser validates or refreshes that session.
        isLoading: value && state.isAuthenticated ? true : state.isLoading,
      })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setTokenStorage(state.accessToken);
        }
        state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * Let the axios client ask for a plan refresh without importing this store
 * (which would close an import cycle back through `@/lib/api`).
 */
registerPlanDesyncHandler(() => {
  void useAuthStore.getState().refreshPlan();
});
