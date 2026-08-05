export type KycStatusFailure = 'not-found' | 'unavailable';

export function classifyKycStatusError(error: unknown): KycStatusFailure {
  if (!error || typeof error !== 'object') return 'unavailable';

  const response = (error as { response?: { status?: unknown } }).response;
  return response?.status === 404 ? 'not-found' : 'unavailable';
}
