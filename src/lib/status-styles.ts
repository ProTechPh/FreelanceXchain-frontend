// Centralized status -> badge color mapping, shared across project/proposal/contract/
// milestone/dispute/KYC/availability statuses so pages stop redefining their own
// `statusColors` maps. Values that mean the same thing across domains (e.g. "pending",
// "completed") intentionally share one color regardless of which entity they describe.

const STATUS_COLORS: Record<string, string> = {
  // positive / success / active
  completed: 'bg-green-500/10 text-green-500',
  approved: 'bg-green-500/10 text-green-500',
  active: 'bg-green-500/10 text-green-500',
  accepted: 'bg-green-500/10 text-green-500',
  available: 'bg-green-500/10 text-green-500',
  resolved: 'bg-green-500/10 text-green-500',
  open: 'bg-green-500/10 text-green-500',

  // pending / warning
  pending: 'bg-yellow-500/10 text-yellow-500',
  submitted: 'bg-yellow-500/10 text-yellow-500',
  under_review: 'bg-yellow-500/10 text-yellow-500',
  busy: 'bg-yellow-500/10 text-yellow-500',
  releasing: 'bg-yellow-500/10 text-yellow-500',

  // in progress / info
  in_progress: 'bg-blue-500/10 text-blue-500',

  // negative / danger / inactive
  cancelled: 'bg-red-500/10 text-red-500',
  rejected: 'bg-red-500/10 text-red-500',
  disputed: 'bg-red-500/10 text-red-500',
  withdrawn: 'bg-red-500/10 text-red-500',
  expired: 'bg-red-500/10 text-red-500',
  refunded: 'bg-red-500/10 text-red-500',

  // neutral
  draft: 'bg-gray-500/10 text-gray-500',
  unavailable: 'bg-gray-500/10 text-gray-500',
};

const DEFAULT_STATUS_COLOR = 'bg-gray-500/10 text-gray-500';

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? DEFAULT_STATUS_COLOR;
}
