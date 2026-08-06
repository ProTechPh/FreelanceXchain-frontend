import type { Notification, UserRole } from '@/types';

function stringData(notification: Notification, key: string): string | null {
  const value = notification.data?.[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function participantContractRoute(role: UserRole, contractId: string | null): string | null {
  if (!contractId || (role !== 'freelancer' && role !== 'employer')) return null;
  return `/dashboard/${role}/contracts/${encodeURIComponent(contractId)}`;
}

export function getNotificationDestination(notification: Notification, role: UserRole): string | null {
  if (role === 'admin') {
    return notification.type.startsWith('dispute_') ? '/dashboard/admin/disputes' : null;
  }

  const contractId = stringData(notification, 'contractId') ?? stringData(notification, 'relatedId');
  if (notification.type === 'message') return `/dashboard/${role}/messages`;
  if (notification.type === 'rating_received') return `/dashboard/${role}/reputation`;
  if (notification.type.startsWith('dispute_')) {
    const disputeId = stringData(notification, 'disputeId') ?? stringData(notification, 'relatedId');
    return disputeId ? `/dashboard/${role}/disputes/${encodeURIComponent(disputeId)}` : `/dashboard/${role}/disputes`;
  }

  if (notification.type === 'proposal_received' && role === 'employer') {
    const projectId = stringData(notification, 'projectId');
    return projectId ? `/dashboard/employer/projects/${encodeURIComponent(projectId)}/proposals` : null;
  }

  if (notification.type === 'proposal_accepted') {
    const contractRoute = participantContractRoute(role, contractId);
    if (contractRoute) return contractRoute;
  }

  if (notification.type === 'proposal_rejected' && role === 'freelancer') {
    const proposalId = stringData(notification, 'proposalId');
    return proposalId ? `/dashboard/freelancer/proposals/${encodeURIComponent(proposalId)}` : null;
  }

  if (
    notification.type.startsWith('milestone_')
    || notification.type === 'payment_released'
    || notification.type.startsWith('refund_')
    || notification.type.startsWith('rush_upgrade_')
  ) {
    return participantContractRoute(role, contractId);
  }

  return null;
}
