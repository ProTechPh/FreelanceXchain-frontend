const CSRF_COOKIE_NAMES = [
  '__Host-psifi.x-csrf-token',
  'psifi.x-csrf-token',
] as const;

type CsrfCookieName = (typeof CSRF_COOKIE_NAMES)[number];

interface CsrfTokenResponse {
  cookieName: string;
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
  let initialized = false;
  let tokenRequest: Promise<string> | null = null;

  const currentToken = (): string | null => (
    cookieName ? readCsrfCookie(readCookies(), cookieName) : null
  );

  const generateToken = async (): Promise<string> => {
    const response = await requestToken();
    if (!isCsrfCookieName(response.cookieName)) {
      throw new Error('The API returned an unsupported CSRF cookie name.');
    }

    cookieName = response.cookieName;
    const token = currentToken();
    if (!token) {
      throw new Error('The API did not set a readable CSRF token cookie.');
    }

    initialized = true;
    return token;
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
