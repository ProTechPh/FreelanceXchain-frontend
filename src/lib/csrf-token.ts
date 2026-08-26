const CSRF_COOKIE_NAMES = [
  '__Host-psifi.x-csrf-token',
  'psifi.x-csrf-token',
] as const;

type CsrfCookieName = (typeof CSRF_COOKIE_NAMES)[number];

interface CsrfTokenResponse {
  cookieName: string;
  token?: string;
}

interface CsrfTokenManagerDependencies {
  readCookies: () => string;
  requestToken: () => Promise<CsrfTokenResponse>;
}

interface EnsureTokenOptions {
  forceRefresh?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCsrfCookieName(value: string): value is CsrfCookieName {
  return CSRF_COOKIE_NAMES.some(cookieName => cookieName === value);
}

export function readCsrfCookie(cookieHeader: string, cookieName: string): string | null {
  for (const entry of cookieHeader.split(';')) {
    const separatorIndex = entry.indexOf('=');
    if (separatorIndex === -1) continue;

    const name = entry.slice(0, separatorIndex).trim();
    if (name !== cookieName) continue;

    const value = entry.slice(separatorIndex + 1);
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return null;
}

export function isCsrfValidationFailure(error: unknown): boolean {
  if (!isRecord(error) || !isRecord(error.response)) return false;

  const { response } = error;
  if (response.status !== 403 || !isRecord(response.data)) return false;
  if (!isRecord(response.data.error)) return false;

  return response.data.error.code === 'CSRF_VALIDATION_FAILED';
}

export function createCsrfTokenManager({
  readCookies,
  requestToken,
}: CsrfTokenManagerDependencies) {
  let cookieName: CsrfCookieName | null = null;
  let memoryToken: string | null = null;
  let initialized = false;
  let tokenRequest: Promise<string> | null = null;

  const currentToken = (): string | null => (
    memoryToken || (cookieName ? readCsrfCookie(readCookies(), cookieName) : null)
  );

  const generateToken = async (): Promise<string> => {
    try {
      const response = await requestToken();
      if (isCsrfCookieName(response.cookieName)) {
        cookieName = response.cookieName;
      }

      if (response.token) {
        memoryToken = response.token;
      }

      const token = currentToken() || response.token || '';
      initialized = true;
      return token;
    } catch {
      return '';
    }
  };

  const ensureToken = async (options: EnsureTokenOptions = {}): Promise<string> => {
    if (tokenRequest) return tokenRequest;

    const token = currentToken();
    if (!options.forceRefresh && initialized && token) return token;

    tokenRequest = generateToken().finally(() => {
      tokenRequest = null;
    });
    return tokenRequest;
  };

  return {
    ensureToken,
  };
}
