/**
 * Hiring-flow presentation logic: which lifecycle step a contract is on and
 * what (if anything) the viewer has to do next.
 */
import type { ContractStatus, ContractPartyRole, NegotiationPermissions } from '@/types';

export const LIFECYCLE_STEPS = [
  { id: 'negotiate', label: 'Negotiate' },
  { id: 'sign', label: 'Sign' },
  { id: 'fund', label: 'Fund' },
  { id: 'work', label: 'Work' },
  { id: 'complete', label: 'Complete' },
] as const;

/** Index into LIFECYCLE_STEPS; -1 for statuses outside the hiring flow (cancelled). */
export function getLifecycleStepIndex(status: ContractStatus): number {
  switch (status) {
    case 'negotiating': return 0;
    case 'awaiting_signatures': return 1;
    case 'awaiting_funding':
    case 'pending': return 2;
    case 'active':
    case 'disputed': return 3;
    case 'completed':
    case 'resolved': return LIFECYCLE_STEPS.length;
    default: return -1;
  }
}

export type NextAction =
  | 'respond_to_offer'
  | 'propose_terms'
  | 'waiting_on_counterparty'
  | 'sign'
  | 'waiting_for_freelancer_signature'
  | 'waiting_for_employer_signature'
  | 'fund'
  | 'waiting_for_funding'
  | 'none';

export function getNextAction(input: {
  status: ContractStatus;
  role: ContractPartyRole;
  permissions?: Pick<NegotiationPermissions, 'canAccept' | 'canPropose'> | null;
  hasOpenOffer?: boolean;
  nextSigner?: ContractPartyRole | null;
}): NextAction {
  const { status, role } = input;
  if (status === 'negotiating') {
    if (input.permissions?.canAccept) return 'respond_to_offer';
    if (input.hasOpenOffer) return 'waiting_on_counterparty';
    return input.permissions?.canPropose ? 'propose_terms' : 'waiting_on_counterparty';
  }
  if (status === 'awaiting_signatures') {
    if (input.nextSigner === role) return 'sign';
    if (input.nextSigner === 'freelancer') return 'waiting_for_freelancer_signature';
    if (input.nextSigner === 'employer') return 'waiting_for_employer_signature';
    return 'none';
  }
  if (status === 'awaiting_funding') return role === 'employer' ? 'fund' : 'waiting_for_funding';
  return 'none';
}

export const NEXT_ACTION_COPY: Record<NextAction, string> = {
  respond_to_offer: 'Review the latest offer',
  propose_terms: 'Propose contract terms',
  waiting_on_counterparty: 'Waiting for the other party',
  sign: 'Sign the contract',
  waiting_for_freelancer_signature: 'Waiting for the freelancer to sign',
  waiting_for_employer_signature: 'Waiting for the client to sign',
  fund: 'Fund the escrow',
  waiting_for_funding: 'Waiting for the client to fund',
  none: '',
};

/** True for statuses where the viewer may need to act before work starts. */
export function isPreWorkStatus(status: ContractStatus): boolean {
  return status === 'negotiating' || status === 'awaiting_signatures' || status === 'awaiting_funding';
}

export type FundingCountdown = { expired: boolean; urgent: boolean; label: string; msRemaining: number };

export function getFundingCountdown(deadline: string | null | undefined, now: Date = new Date()): FundingCountdown | null {
  if (!deadline) return null;
  const end = Date.parse(deadline);
  if (Number.isNaN(end)) return null;
  const msRemaining = end - now.getTime();
  if (msRemaining <= 0) return { expired: true, urgent: true, label: 'Funding deadline passed', msRemaining: 0 };
  const totalMinutes = Math.floor(msRemaining / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = days > 0 ? [`${days}d`, `${hours}h`] : hours > 0 ? [`${hours}h`, `${minutes}m`] : [`${Math.max(1, minutes)}m`];
  return { expired: false, urgent: msRemaining < 24 * 3600_000, label: `${parts.join(' ')} left to fund`, msRemaining };
}
