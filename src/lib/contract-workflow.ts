import type {
  ContractStatus,
  KycStatus,
  Milestone,
  MilestoneStatus,
  UserRole,
} from '@/types';
import { hasApprovedKyc } from './kyc-eligibility.ts';

function stringValue(record: Record<string, unknown>, camel: string, snake: string): string | undefined {
  const value = record[camel] ?? record[snake];
  return typeof value === 'string' ? value : undefined;
}

export function normalizeMilestone(value: unknown): Milestone {
  const milestone = value as Record<string, unknown>;
  const contractId = stringValue(milestone, 'contractId', 'contract_id');
  const submittedAt = stringValue(milestone, 'submittedAt', 'submitted_at');
  const approvedAt = stringValue(milestone, 'approvedAt', 'approved_at');
  const rejectedAt = stringValue(milestone, 'rejectedAt', 'rejected_at');
  const rejectionReason = stringValue(milestone, 'rejectionReason', 'rejection_reason');
  const notes = stringValue(milestone, 'notes', 'submission_notes');
  const files = milestone.deliverableFiles ?? milestone.deliverable_files;

  return {
    id: String(milestone.id ?? ''),
    ...(contractId ? { contractId } : {}),
    title: String(milestone.title ?? 'Milestone'),
    description: String(milestone.description ?? ''),
    amount: Number(milestone.amount ?? 0),
    dueDate: stringValue(milestone, 'dueDate', 'due_date') ?? '',
    status: String(milestone.status ?? 'pending') as MilestoneStatus,
    ...(submittedAt ? { submittedAt } : {}),
    ...(approvedAt ? { approvedAt } : {}),
    ...(rejectedAt ? { rejectedAt } : {}),
    ...(rejectionReason ? { rejectionReason } : {}),
    ...(notes ? { notes } : {}),
    ...(Array.isArray(files) ? { deliverableFiles: files as Milestone['deliverableFiles'] } : {}),
  };
}

export function getContractPermissions(
  status: ContractStatus,
  role: UserRole,
  kycStatus: KycStatus | undefined,
) {
  const verified = hasApprovedKyc(kycStatus);
  return {
    // Negotiated contracts are funded once both parties signed (awaiting_funding);
    // 'pending' is the legacy accept-then-fund status.
    canFund: role === 'employer' && (status === 'pending' || status === 'awaiting_funding') && verified,
    canCancel: role !== 'admin'
      && ['pending', 'negotiating', 'awaiting_signatures', 'awaiting_funding'].includes(status)
      && verified,
  };
}

export function getMilestonePermissions(
  milestoneStatus: MilestoneStatus,
  role: UserRole,
  kycStatus: KycStatus | undefined,
  contractStatus: ContractStatus,
) {
  const actionable = hasApprovedKyc(kycStatus) && contractStatus === 'active';
  return {
    canSubmit: actionable
      && role === 'freelancer'
      && ['pending', 'in_progress', 'rejected'].includes(milestoneStatus),
    canApprove: actionable && role === 'employer' && ['submitted', 'in_progress'].includes(milestoneStatus),
    canReject: actionable && role === 'employer' && milestoneStatus === 'submitted',
  };
}
