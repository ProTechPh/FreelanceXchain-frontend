import type { CSSProperties } from 'react';
import type { TutorialStep } from '../types';
import { TutorialProgress } from './TutorialProgress';

interface TutorialTooltipCardProps {
  step: TutorialStep;
  stepNumber: number;
  totalSteps: number;
  targetRect: DOMRect | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onPause: () => void;
}

function getCardStyle(step: TutorialStep, targetRect: DOMRect | null): CSSProperties {
  const width = 360;
  const margin = 16;

  if (!targetRect) {
    return { right: margin, bottom: margin };
  }

  const placement = step.anchor.placement === 'auto' ? 'bottom' : step.anchor.placement;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let top = targetRect.bottom + margin;
  let left = targetRect.left;

  if (placement === 'top') top = targetRect.top - 220;
  if (placement === 'left') {
    top = targetRect.top;
    left = targetRect.left - width - margin;
  }
  if (placement === 'right') {
    top = targetRect.top;
    left = targetRect.right + margin;
  }

  if (left + width > viewportWidth - margin) left = viewportWidth - width - margin;
  if (left < margin) left = margin;
  if (top < margin) top = margin;
  if (top > viewportHeight - 260) top = viewportHeight - 260;

  return { top, left };
}

export function TutorialTooltipCard({
  step,
  stepNumber,
  totalSteps,
  targetRect,
  onNext,
  onPrev,
  onSkip,
  onPause,
}: TutorialTooltipCardProps) {
  const isLast = stepNumber === totalSteps;
  const style = getCardStyle(step, targetRect);

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed z-[95] w-[360px] max-w-[calc(100vw-1.5rem)] rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-surface shadow-2xl p-4 space-y-4"
      style={style}
    >
      <TutorialProgress current={stepNumber} total={totalSteps} />
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{step.title}</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">{step.body}</p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          onClick={onPause}
        >
          Resume later
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
            onClick={onPrev}
            disabled={stepNumber === 1}
          >
            Back
          </button>
          {step.behavior.allowSkip && (
            <button
              type="button"
              className="px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              onClick={onSkip}
            >
              Skip
            </button>
          )}
          <button
            type="button"
            className="px-3 py-2 rounded-md text-sm bg-primary-600 hover:bg-primary-700 text-white transition-colors"
            onClick={onNext}
          >
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
