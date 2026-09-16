import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { isPlanUpgradeRequired } from '@/lib/plan-access';
import { notifyPlanDesync } from '@/lib/plan-sync';
import {
  createCsrfTokenManager,
  isCsrfValidationFailure,
} from '@/lib/csrf-token';
import {
  clearAccessToken,
  getAccessToken,
  onTokenChange,
} from '@/lib/auth-token';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Generate once before the first mutation instead of trusting a cookie left by an
// older API process. The response tells us which environment-specific cookie to
// echo, and a CSRF rejection triggers one forced refresh below.
export const csrfTokenManager = createCsrfTokenManager({
  readCookies: () => (typeof document === 'undefined' ? '' : document.cookie),
  requestToken: async () => {
    // Use plain axios so the token request cannot recurse through this interceptor.
    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await axios.post<{ cookieName: string; token?: string }>(
      `${API_URL}/auth/csrf-token`,
      undefined,
      { withCredentials: true, headers },
    );
    return response.data;
  },
});

onTokenChange(() => {
  csrfTokenManager.reset();
});

type CsrfRetryConfig = InternalAxiosRequestConfig & {
  csrfRetryAttempted?: boolean;
};

function isSessionRecoveryRequest(config: InternalAxiosRequestConfig | undefined): boolean {
  if (!config?.url) return false;
  const url = config.url;
  return (
    url === '/auth/me' ||
    url === '/auth/refresh' ||
    url.endsWith('/auth/me') ||
    url.endsWith('/auth/refresh')
  );
}

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const method = (config.method ?? 'get').toUpperCase();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      try {
        const csrfToken = await csrfTokenManager.ensureToken();
        if (csrfToken) {
          config.headers['x-csrf-token'] = csrfToken;
        }
      } catch {
        // Proceed without csrf header for exempt or cross-subdomain requests
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const requestConfig = error.config as CsrfRetryConfig | undefined;
    if (
      isCsrfValidationFailure(error)
      && requestConfig
      && !requestConfig.csrfRetryAttempted
    ) {
      requestConfig.csrfRetryAttempted = true;
      const csrfToken = await csrfTokenManager.ensureToken({ forceRefresh: true });
      requestConfig.headers['x-csrf-token'] = csrfToken;
      return api.request(requestConfig);
    }

    // A 403 PLAN_UPGRADE_REQUIRED means the client thought it had Pro and the
    // server disagreed — a cancellation elsewhere, or a long-lived tab. Refresh
    // the plan so the gates re-render into locks without a reload. No toast and
    // no redirect: the lock panel is the message. Cannot loop, because
    // /auth/me is not itself gated.
    if (isPlanUpgradeRequired(error)) {
      notifyPlanDesync();
    }

    if (error.response?.status === 401) {
      clearAccessToken();
      if (!isSessionRecoveryRequest(requestConfig) && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
