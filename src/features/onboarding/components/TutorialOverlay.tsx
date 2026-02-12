import type { TutorialStep } from '../types';
import { Spotlight } from './Spotlight';
import { TutorialTooltipCard } from './TutorialTooltipCard';

interface TutorialOverlayProps {
  step: TutorialStep;
  stepNumber: number;
  totalSteps: number;
  targetRect: DOMRect | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onPause: () => void;
  onBackdropDismiss: () => void;
}

export function TutorialOverlay({
  step,
  stepNumber,
  totalSteps,
  targetRect,
  onNext,
  onPrev,
  onSkip,
  onPause,
  onBackdropDismiss,
}: TutorialOverlayProps) {
  return (
    <>
      <Spotlight
        rect={targetRect}
        padding={step.anchor.padding ?? 8}
        blockInteraction={step.behavior.blockInteraction}
        onBackdropClick={step.behavior.allowBackdropClose ? onBackdropDismiss : undefined}
      />
      <TutorialTooltipCard
        step={step}
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        targetRect={targetRect}
        onNext={onNext}
        onPrev={onPrev}
        onSkip={onSkip}
        onPause={onPause}
      />
    </>
  );
}
