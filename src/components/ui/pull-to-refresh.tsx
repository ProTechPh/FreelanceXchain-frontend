'use client';

import { useState, useCallback, useRef, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  /** Callback fired when refresh is triggered */
  onRefresh: () => Promise<void> | void;
  /** Content to wrap */
  children: ReactNode;
  /** Custom class for container */
  className?: string;
  /** Distance in pixels needed to pull to trigger refresh (default: 80) */
  threshold?: number;
  /** Whether refresh is currently disabled */
  disabled?: boolean;
}

/**
 * Pull-to-refresh gesture handler for mobile data screens.
 * Implements the standard mobile UX pattern where users can pull down
 * on a scrollable area to refresh its content.
 */
export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;
      const container = containerRef.current;
      if (!container || container.scrollTop > 0) return;

      startYRef.current = e.touches[0]?.clientY ?? 0;
      isDraggingRef.current = true;
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current || disabled || isRefreshing) return;

      const currentY = e.touches[0]?.clientY ?? 0;
      const delta = currentY - startYRef.current;

      if (delta <= 0) {
        setPullDistance(0);
        setIsPulling(false);
        return;
      }

      const resistance = 0.5;
      const newDistance = Math.min(delta * resistance, threshold * 1.5);
      setPullDistance(newDistance);
      setIsPulling(true);

      if (newDistance > 0) e.preventDefault();
    },
    [disabled, isRefreshing, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing && !disabled) {
      setIsRefreshing(true);
      setPullDistance(threshold);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, disabled, onRefresh]);

  

  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = isPulling || isRefreshing;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center z-10',
          'transition-all duration-200 ease-out',
          showIndicator ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        style={{ height: Math.max(0, pullDistance), transform: `translateY(${showIndicator ? 0 : -48}px)` }}
        aria-hidden="true"
      >
        <div className={cn('flex flex-col items-center gap-1 py-2', isRefreshing && 'animate-spin')}>
          <RefreshCw className={cn('size-6', progress >= 1 ? 'text-primary' : 'text-muted-foreground')} />
          <span className="text-xs text-muted-foreground">
            {isRefreshing ? 'Refreshing…' : progress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      <div
        className={cn('transition-transform duration-200 ease-out', isRefreshing && 'pointer-events-none opacity-60')}
        style={{ transform: `translateY(${showIndicator ? pullDistance : 0}px)` }}
      >
        {children}
      </div>

      {isRefreshing && <span className="sr-only" role="status" aria-live="polite">Refreshing content…</span>}
    </div>
  );
}

/** Hook to provide pull-to-refresh functionality. */
export function usePullToRefresh(
  onRefresh: () => Promise<void> | void,
  options: { threshold?: number; disabled?: boolean } = {}
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { threshold = 80, disabled = false } = options;

  const handleRefresh = useCallback(async () => {
    if (isRefreshing || disabled) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing, disabled]);

  return { isRefreshing, handleRefresh, pullProps: { onRefresh: handleRefresh, threshold, disabled: disabled || isRefreshing } };
}