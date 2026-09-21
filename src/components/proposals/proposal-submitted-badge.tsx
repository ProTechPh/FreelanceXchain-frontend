import { CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import type { ProposalStatus } from '@/types';

/**
 * What each state means to the freelancer scanning a list. The wording is about
 * their own bid, not about the project, so "rejected" reads as "not selected"
 * rather than as something wrong with the listing.
 */
const LABEL: Record<ProposalStatus, string> = {
  pending: 'Proposal sent',
  accepted: 'Proposal accepted',
  rejected: 'Not selected',
  withdrawn: 'Proposal withdrawn',
};

interface ProposalSubmittedBadgeProps {
  status: ProposalStatus;
  size?: 'sm' | 'default';
  className?: string;
}

/**
 * Marks a project the signed-in freelancer has already bid on.
 *
 * Tone comes from the shared proposal status map, so a sent proposal reads
 * amber (awaiting the employer) and an accepted one green on every surface.
 * The state is carried by the label text, never by colour alone.
 */
export function ProposalSubmittedBadge({ status, size = 'sm', className }: ProposalSubmittedBadgeProps) {
  return (
    <StatusBadge
      status={status}
      domain="proposal"
      label={
        <>
          <CheckCircle2 className={cn(size === 'sm' ? 'size-3' : 'size-3.5')} aria-hidden="true" />
          {LABEL[status]}
        </>
      }
      size={size}
      className={className}
    />
  );
}
