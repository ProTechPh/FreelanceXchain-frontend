/**
 * In-memory access token management to protect against XSS token exfiltration (OWASP Top 10 / CWE-312).
 *
 * Long-lived refresh tokens are never stored in client-accessible storage (localStorage/sessionStorage);
 * they reside strictly in HttpOnly, SameSite cookies scoped to the /api/auth path.
 *
 * Short-lived access tokens are retained primarily in memory.
 * For environments where cookies are unavailable (e.g. disabled cookies, non-browser clients, or pre-seeded test setups),
 * fallback mechanisms allow read/write compatibility without exposing refresh tokens.
 */

let inMemoryAccessToken: string | null = null;

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // Storage access blocked by browser security policy
  }
  return null;
}

/**
 * Returns true if cookies are enabled in the current environment.
 */
export function isCookieSupported(): boolean {
  try {
    const nav = typeof window !== 'undefined' ? window.navigator : (typeof globalThis !== 'undefined' ? globalThis.navigator : undefined);
    if (!nav) return false;
    return nav.cookieEnabled !== false;
  } catch {
    return false;
  }
}

/**
 * Retrieves the currently active access token.
 * Prioritizes the fast in-memory token.
 * Falls back to storage if memory is not yet hydrated (e.g. after browser reopen).
 */
export function getAccessToken(): string | null {
  if (inMemoryAccessToken) {
    return inMemoryAccessToken;
  }
  const storage = getStorage();
  if (storage) {
    const storedToken = storage.getItem('access_token');
    if (storedToken) {
      inMemoryAccessToken = storedToken;
      return storedToken;
    }
  }
  return null;
}

/**
 * Sets the active access token in memory and persists to storage
 * so the authenticated session survives browser closing/reopening.
 * Always purges any legacy refresh_token from client storage.
 */
export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
  const storage = getStorage();

  if (storage) {
    // Purge legacy refresh tokens from client-accessible storage
    storage.removeItem('refresh_token');

    if (token) {
      storage.setItem('access_token', token);
    } else {
      storage.removeItem('access_token');
    }
  }
}

/**
 * Clears the active access token and purges storage.
 */
export function clearAccessToken(): void {
  inMemoryAccessToken = null;
  const storage = getStorage();

  if (storage) {
    storage.removeItem('access_token');
    storage.removeItem('refresh_token');
  }
}

/**
 * Resets the in-memory token cache (used for tests simulating browser restarts).
 */
export function resetInMemoryToken(): void {
  inMemoryAccessToken = null;
}
