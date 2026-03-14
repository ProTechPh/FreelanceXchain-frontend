import { clsx } from 'clsx';
import { CheckCircle, Clock, XCircle, AlertTriangle, Loader } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const statusConfig: Record<string, { color: string; bg: string; icon: typeof CheckCircle; label: string }> = {
    active: {
      color: 'text-green-400',
      bg: 'bg-green-500/10 border-green-500/20',
      icon: CheckCircle,
      label: 'Active',
    },
    pending: {
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      icon: Clock,
      label: 'Pending',
    },
    in_progress: {
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      icon: Loader,
      label: 'In Progress',
    },
    completed: {
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      icon: CheckCircle,
      label: 'Completed',
    },
    accepted: {
      color: 'text-green-400',
      bg: 'bg-green-500/10 border-green-500/20',
      icon: CheckCircle,
      label: 'Accepted',
    },
    rejected: {
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      icon: XCircle,
      label: 'Rejected',
    },
    withdrawn: {
      color: 'text-gray-400',
      bg: 'bg-gray-500/10 border-gray-500/20',
      icon: XCircle,
      label: 'Withdrawn',
    },
    cancelled: {
      color: 'text-gray-400',
      bg: 'bg-gray-500/10 border-gray-500/20',
      icon: XCircle,
      label: 'Cancelled',
    },
    disputed: {
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/20',
      icon: AlertTriangle,
      label: 'Disputed',
    },
    open: {
      color: 'text-primary-400',
      bg: 'bg-primary-500/10 border-primary-500/20',
      icon: Clock,
      label: 'Open',
    },
    closed: {
      color: 'text-gray-400',
      bg: 'bg-gray-500/10 border-gray-500/20',
      icon: XCircle,
      label: 'Closed',
    },
    processing: {
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      icon: Loader,
      label: 'Processing',
    },
    submitted: {
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      icon: Clock,
      label: 'Submitted',
    },
    approved: {
      color: 'text-green-400',
      bg: 'bg-green-500/10 border-green-500/20',
      icon: CheckCircle,
      label: 'Approved',
    },
  };

  const config = statusConfig[status.toLowerCase()] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
        config.color,
        config.bg,
        className
      )}
    >
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      {config.label}
    </span>
  );
}
