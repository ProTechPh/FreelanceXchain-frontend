'use client';

import * as React from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function formatRelativeTimeStatic(d: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 30) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

interface DataFreshnessProps {
  /** When the data was last fetched (Date object or ISO string) */
  lastUpdated: Date | string;
  /** Whether data is currently refreshing */
  isRefreshing?: boolean;
  /** Callback to trigger manual refresh */
  onRefresh?: () => void | Promise<void>;
  /** Whether refresh button should be shown */
  showRefresh?: boolean;
  /** Label describing what data this refers to */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'default';
  /** Additional className */
  className?: string;
}

/**
 * Shows when data was last updated with optional manual refresh.
 *
 * Implements UX best practice: "Real-time data has timestamp showing freshness"
 * Users can see how stale data is and manually refresh if needed.
 *
 * @example
 * ```tsx
 * <DataFreshness
 *   lastUpdated={lastFetchTime}
 *   isRefreshing={isLoading}
 *   onRefresh={refetch}
 *   label="projects"
 * />
 * ```
 */
export function DataFreshness({
  lastUpdated,
  isRefreshing = false,
  onRefresh,
  showRefresh = true,
  label = 'data',
  size = 'default',
  className,
}: DataFreshnessProps) {
  const [relativeTime, setRelativeTime] = React.useState(() => {
    const date = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated;
    return formatRelativeTimeStatic(date);
  });

  React.useEffect(() => {
    const date = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated;
    
    // Update relative time every 30 seconds
    const updateRelativeTime = () => {
      setRelativeTime(formatRelativeTimeStatic(date));
    };
    
    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 30000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      await onRefresh();
    }
  };

  const sizeClasses = {
    sm: {
      text: 'text-xs',
      icon: 'size-3',
      gap: 'gap-1.5',
    },
    default: {
      text: 'text-sm',
      icon: 'size-3.5',
      gap: 'gap-2',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex items-center text-muted-foreground',
        classes.gap,
        classes.text,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Clock className={cn(classes.icon, 'shrink-0')} aria-hidden="true" />

      <span className="whitespace-nowrap">
        {label} updated {relativeTime}
      </span>

      {showRefresh && onRefresh && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label={`Refresh ${label}`}
          className={cn(
            'size-6 rounded',
            'hover:bg-muted'
          )}
        >
          <RefreshCw
            className={cn(
              classes.icon,
              'shrink-0',
              isRefreshing && 'animate-spin'
            )}
            aria-hidden="true"
          />
        </Button>
      )}
    </div>
  );
}

/**
 * Hook to track data freshness state.
 *
 * @example
 * ```tsx
 * const { lastUpdated, isRefreshing, touch, refresh } = useDataFreshness();
 *
 * // Call touch() after successful data fetch
 * const { data } = await fetchData();
 * touch();
 *
 * // Pass to DataFreshness component
 * <DataFreshness
 *   lastUpdated={lastUpdated}
 *   isRefreshing={isRefreshing}
 *   onRefresh={refresh(fetchData)}
 * />
 * ```
 */
export function useDataFreshness() {
  const [lastUpdated, setLastUpdated] = React.useState(() => new Date());
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const touch = React.useCallback(() => {
    setLastUpdated(new Date());
  }, []);

  const refresh = React.useCallback(
    (fetchFn: () => Promise<void>) => async () => {
      setIsRefreshing(true);
      try {
        await fetchFn();
        touch();
      } finally {
        setIsRefreshing(false);
      }
    },
    [touch]
  );

  return {
    lastUpdated,
    isRefreshing,
    touch,
    refresh,
    setIsRefreshing,
  };
}

export { type DataFreshnessProps };
