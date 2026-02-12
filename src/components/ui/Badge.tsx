import { clsx } from 'clsx';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className,
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    success: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700/50',
    warning: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50',
    error: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700/50',
    info: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700/50',
    primary: 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 border border-primary-300 dark:border-primary-700/50',
    secondary: 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-600/50',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full',
          variant === 'success' && 'bg-green-400',
          variant === 'warning' && 'bg-amber-400',
          variant === 'error' && 'bg-red-400',
          variant === 'info' && 'bg-blue-400',
          variant === 'primary' && 'bg-primary-400',
          variant === 'default' && 'bg-gray-400',
        )} />
      )}
      {children}
    </span>
  );
}

// Status badge component for common status types
interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    // Project statuses
    draft: { variant: 'default', label: 'Draft' },
    open: { variant: 'success', label: 'Open' },
    in_progress: { variant: 'info', label: 'In Progress' },
    completed: { variant: 'success', label: 'Completed' },
    cancelled: { variant: 'error', label: 'Cancelled' },
    
    // Proposal statuses
    pending: { variant: 'warning', label: 'Pending' },
    accepted: { variant: 'success', label: 'Accepted' },
    rejected: { variant: 'error', label: 'Rejected' },
    withdrawn: { variant: 'default', label: 'Withdrawn' },
    
    // Milestone statuses
    submitted: { variant: 'info', label: 'Submitted' },
    approved: { variant: 'success', label: 'Approved' },
    disputed: { variant: 'error', label: 'Disputed' },
    
    // Contract statuses
    active: { variant: 'success', label: 'Active' },
    
    // Dispute statuses
    under_review: { variant: 'warning', label: 'Under Review' },
    resolved: { variant: 'success', label: 'Resolved' },
    
    // KYC statuses
    verified: { variant: 'success', label: 'Verified' },
    
    // Availability
    available: { variant: 'success', label: 'Available' },
    busy: { variant: 'warning', label: 'Busy' },
    unavailable: { variant: 'error', label: 'Unavailable' },
  };

  const config = statusConfig[status] || { variant: 'default' as BadgeVariant, label: status };

  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}
