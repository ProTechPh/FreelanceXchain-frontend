export type OAuthProvider = 'google' | 'github';

const LAST_USED_OAUTH_KEY = 'flxc_last_auth_provider';

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // Ignore listener error
    }
  }
}

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // Storage access blocked by browser security policy (e.g. sandbox or private mode)
  }
  return null;
}

/**
 * Retrieves the last used OAuth provider from local storage.
 * Returns 'google', 'github', or null if none or invalid.
 */
export function getLastUsedOAuthProvider(): OAuthProvider | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const value = storage.getItem(LAST_USED_OAUTH_KEY);
    if (value === 'google' || value === 'github') {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Server snapshot for useSyncExternalStore. Always returns null during SSR.
 */
export function getLastUsedOAuthServerSnapshot(): OAuthProvider | null {
  return null;
}

/**
 * Subscribes to updates of the last used OAuth provider.
 * Notified on both in-tab updates and cross-tab storage events.
 */
export function subscribeToLastUsedOAuth(callback: Listener): () => void {
  listeners.add(callback);

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === LAST_USED_OAUTH_KEY) {
      callback();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

/**
 * Persists the last used OAuth provider to local storage.
 * Passing null removes the stored provider.
 */
export function setLastUsedOAuthProvider(provider: OAuthProvider | null): void {
  const storage = getStorage();
  if (storage) {
    try {
      if (provider === 'google' || provider === 'github') {
        storage.setItem(LAST_USED_OAUTH_KEY, provider);
      } else {
        storage.removeItem(LAST_USED_OAUTH_KEY);
      }
    } catch {
      // Ignore storage write failures (e.g. quota exceeded or storage blocked)
    }
  }
  notifyListeners();
}

/**
 * Clears the last used OAuth provider from local storage.
 */
export function clearLastUsedOAuthProvider(): void {
  setLastUsedOAuthProvider(null);
}
