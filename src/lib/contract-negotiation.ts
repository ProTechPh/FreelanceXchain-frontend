import type { ContractStatus, KycStatus, RushUpgradeRequestStatus } from '@/types';
import { hasApprovedKyc } from './kyc-eligibility.ts';

export function canRequestRushUpgrade(input: {
  role: 'employer' | 'freelancer';
  contractStatus: ContractStatus;
  rushFee: number;
  kycStatus?: KycStatus;
  hasOpenRequest: boolean;
}): boolean {
  return input.role === 'employer'
    && input.contractStatus === 'active'
    && input.rushFee === 0
    && hasApprovedKyc(input.kycStatus)
    && !input.hasOpenRequest;
}

export function canRespondToRushUpgrade(
  role: 'employer' | 'freelancer',
  status: RushUpgradeRequestStatus,
  kycStatus?: KycStatus,
): boolean {
  if (!hasApprovedKyc(kycStatus)) return false;
  if (role === 'freelancer') return status === 'pending';
  return status === 'counter_offered';
}

export function canRequestRefund(
  contractStatus: ContractStatus,
  kycStatus: KycStatus | undefined,
  hasPendingRequest: boolean,
): boolean {
  return contractStatus === 'active' && hasApprovedKyc(kycStatus) && !hasPendingRequest;
}

export function canActOnRefund(input: {
  status: string;
  requestedBy: string;
  currentUserId: string;
  kycStatus?: KycStatus;
}): boolean {
  return input.status === 'pending'
    && input.requestedBy !== input.currentUserId
    && hasApprovedKyc(input.kycStatus);
}
