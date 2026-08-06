import type { KycStatus } from '@/types';

const RETRY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function getKycRetryAvailability(
  verification: { status: KycStatus; created_at: string },
  now = new Date(),
): { canRetry: boolean; retryAt: string; hoursRemaining: number } | null {
  if (verification.status !== 'rejected' && verification.status !== 'expired') return null;
  const createdAt = new Date(verification.created_at).getTime();
  if (!Number.isFinite(createdAt)) return { canRetry: true, retryAt: '', hoursRemaining: 0 };
  const retryAtMs = createdAt + RETRY_COOLDOWN_MS;
  const remainingMs = Math.max(0, retryAtMs - now.getTime());
  return {
    canRetry: remainingMs === 0,
    retryAt: new Date(retryAtMs).toISOString(),
    hoursRemaining: Math.ceil(remainingMs / (60 * 60 * 1000)),
  };
}
