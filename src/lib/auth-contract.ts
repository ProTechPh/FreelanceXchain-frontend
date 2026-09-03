import type {
  AuthApiUser,
  AuthSuccessResponse,
  MfaRequiredResponse,
  User,
} from '@/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUserRole(value: unknown): value is AuthApiUser['role'] {
  return value === 'freelancer' || value === 'employer' || value === 'admin';
}

function isKycStatus(value: unknown): value is NonNullable<AuthApiUser['kycStatus']> {
  return value === 'pending'
    || value === 'in_progress'
    || value === 'completed'
    || value === 'approved'
    || value === 'rejected'
    || value === 'expired';
}

export function isMfaRequiredResponse(response: unknown): response is MfaRequiredResponse {
  return isRecord(response)
    && 'mfaRequired' in response
    && response.mfaRequired === true
    && typeof response.mfaSessionToken === 'string'
    && response.mfaSessionToken.length > 0;
}

export function isRegistrationRequiredResponse(
  response: unknown,
): response is { status: 'registration_required'; message?: string; access_token?: string } {
  return isRecord(response) && response.status === 'registration_required';
}

function firstNonEmptyParameter(
  sources: URLSearchParams[],
  names: string[],
): string | null {
  for (const source of sources) {
    for (const name of names) {
      const value = source.get(name)?.trim();
      if (value) return value;
    }
  }

  return null;
}

export function getPasswordResetToken(searchParams: URLSearchParams): string | null {
  return firstNonEmptyParameter([searchParams], ['accessToken', 'secret', 'token']);
}

export function getAuthCallbackToken(
  searchParams: URLSearchParams,
  fragmentParams: URLSearchParams,
): string | null {
  return firstNonEmptyParameter(
    [searchParams, fragmentParams],
    ['access_token', 'accessToken', 'secret'],
  );
}

export function isAuthSuccessResponse(response: unknown): response is AuthSuccessResponse {
  if (!isRecord(response) || !isRecord(response.user)) return false;

  const { user } = response;

  return typeof user.id === 'string'
    && user.id.length > 0
    && typeof user.email === 'string'
    && user.email.length > 0
    && isUserRole(user.role)
    && typeof user.walletAddress === 'string'
    && typeof user.createdAt === 'string'
    && user.createdAt.length > 0
    && (user.kycStatus === undefined || isKycStatus(user.kycStatus))
    && (user.authProvider === undefined || user.authProvider === 'email' || user.authProvider === 'oauth')
    && typeof response.accessToken === 'string'
    && response.accessToken.length > 0
    && typeof response.refreshToken === 'string'
    && response.refreshToken.length > 0;
}

export function normalizeAuthUser(user: AuthApiUser): User {
  const emailName = user.email.split('@')[0]?.trim();
  const name = (typeof user.name === 'string' && user.name.trim()) ? user.name.trim() : (emailName || 'User');

  return {
    id: user.id,
    email: user.email,
    name,
    role: user.role,
    walletAddress: user.walletAddress,
    ...(user.kycStatus ? { kycStatus: user.kycStatus } : {}),
    ...(typeof user.emailVerification === 'boolean' ? { emailVerification: user.emailVerification } : {}),
    ...(user.authProvider ? { authProvider: user.authProvider } : {}),
    createdAt: user.createdAt,
    updatedAt: user.createdAt,
  };
}

/**
 * Re-exported from `error-messages.ts`, which now owns all failure copy.
 *
 * It lived here for historical reasons while 38 modules imported it from an
 * auth-named file. Prefer `describeFailure` for new code: this helper returns
 * the backend string verbatim, which is right for validation errors and wrong
 * for a 5xx stack trace.
 */
export { getApiErrorMessage } from './error-messages.ts';

export function getRegistrationFormError(
  password: string,
  confirmPassword: string,
  agreedToTerms: boolean,
): string | null {
  const meetsPasswordRequirements = password.length >= 8
    && password.length <= 72
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[@$!%*?&]/.test(password);

  if (!meetsPasswordRequirements) {
    return 'Use 8–72 characters with uppercase, lowercase, a number, and a special character (@$!%*?&).';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }

  if (!agreedToTerms) {
    return 'You must agree to the Terms of Service and Privacy Policy.';
  }

  return null;
}
