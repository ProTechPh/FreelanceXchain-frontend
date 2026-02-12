import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../store';
import type { TutorialStep } from './types';
import { resolveAnchorElement } from './engine';
import { FREELANCER_TUTORIAL_ID } from './steps/freelancerSteps';
import { useOnboardingStore } from './store';

interface SpotlightAnchorState {
  element: HTMLElement | null;
  rect: DOMRect | null;
}

export function useTutorialEligibility() {
  const { isAuthenticated, user } = useAuthStore();
  const { records } = useOnboardingStore();

  return useMemo(() => {
    if (!isAuthenticated || !user || user.role !== 'freelancer') {
      return { eligible: false, alreadyFinished: false };
    }

    const key = `${user.id}:${FREELANCER_TUTORIAL_ID}`;
    const record = records[key];
    const alreadyFinished = record?.status === 'completed' || record?.status === 'dismissed';
    return {
      eligible: true,
      alreadyFinished,
    };
  }, [isAuthenticated, records, user]);
}

export function useSpotlightAnchor(step: TutorialStep | null, enabled: boolean): SpotlightAnchorState {
  const [state, setState] = useState<SpotlightAnchorState>({
    element: null,
    rect: null,
  });

  useEffect(() => {
    if (!enabled || !step) {
      setState({ element: null, rect: null });
      return;
    }

    const anchor = resolveAnchorElement(step);
    if (!anchor) {
      setState({ element: null, rect: null });
      return;
    }

    const updateRect = () => {
      const rect = anchor.getBoundingClientRect();
      setState({ element: anchor, rect });
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [enabled, step]);

  return state;
}

export function useTutorialKeyboardShortcuts(options: {
  enabled: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const { enabled, onClose, onNext, onPrev } = options;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') onNext();
      if (event.key === 'ArrowLeft') onPrev();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, onClose, onNext, onPrev]);
}
