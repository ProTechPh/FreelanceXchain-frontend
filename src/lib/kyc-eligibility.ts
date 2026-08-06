import type { KycStatus } from '@/types';

// Mirrors the current backend requireVerifiedKyc middleware. A completed
// verification is still under review and cannot perform protected mutations.
export function hasApprovedKyc(status: KycStatus | undefined): boolean {
  return status === 'approved';
}
