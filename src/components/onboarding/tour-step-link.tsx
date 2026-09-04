'use client';

import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useStartTour } from './tour-launcher';

/**
 * Drops the reader into one step of the tour.
 *
 * Used from empty states: "no contracts yet" is the moment someone most wants to
 * know how contracts work here, and it is the moment there is nothing on screen
 * to tell them.
 */
export function TourStepLink({
  step,
  children,
  className,
}: {
  step: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { startTour, canStartTour } = useStartTour();

  if (!canStartTour) return null;

  return (
    <button
      type="button"
      onClick={() => startTour(step)}
      className={cn(
        'inline-flex items-center gap-1 rounded-md text-xs font-semibold text-primary',
        'transition-colors duration-fast ease-out outline-none',
        'hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      {children}
      <ArrowRight className="size-3" aria-hidden="true" />
    </button>
  );
}
