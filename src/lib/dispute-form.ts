import type { KycStatus } from '@/types';

export type DisputeDraft = {
  contractId: string;
  milestoneId: string;
  reason: string;
};

export function canUseDisputeActions(kycStatus: KycStatus | undefined) {
  return kycStatus === 'approved' || kycStatus === 'completed';
}

export function validateDisputeDraft(draft: DisputeDraft): string | null {
  if (!draft.contractId) return 'Choose a contract.';
  if (!draft.milestoneId) return 'Choose a milestone.';
  if (draft.reason.trim().length < 10) return 'Describe the issue in at least 10 characters.';
  return null;
}

export function validateEvidenceLink(value: string): string | null {
  if (!value.trim()) return 'Enter an evidence link.';
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? null : 'Enter a valid HTTPS evidence link.';
  } catch {
    return 'Enter a valid HTTPS evidence link.';
  }
}
