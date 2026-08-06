import type { ContractStatus, KycStatus, RushUpgradeRequestStatus } from '@/types';

function hasVerifiedKyc(status: KycStatus | undefined): boolean {
  return status === 'approved' || status === 'completed';
}

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
    && hasVerifiedKyc(input.kycStatus)
    && !input.hasOpenRequest;
}

export function canRespondToRushUpgrade(
  role: 'employer' | 'freelancer',
  status: RushUpgradeRequestStatus,
  kycStatus?: KycStatus,
): boolean {
  if (!hasVerifiedKyc(kycStatus)) return false;
  if (role === 'freelancer') return status === 'pending';
  return status === 'counter_offered';
}

export function canRequestRefund(
  contractStatus: ContractStatus,
  kycStatus: KycStatus | undefined,
  hasPendingRequest: boolean,
): boolean {
  return contractStatus === 'active' && hasVerifiedKyc(kycStatus) && !hasPendingRequest;
}

export function canActOnRefund(input: {
  status: string;
  requestedBy: string;
  currentUserId: string;
  kycStatus?: KycStatus;
}): boolean {
  return input.status === 'pending'
    && input.requestedBy !== input.currentUserId
    && hasVerifiedKyc(input.kycStatus);
}
