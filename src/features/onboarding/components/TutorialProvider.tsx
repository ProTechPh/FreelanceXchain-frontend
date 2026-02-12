import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store';
import { canAccessStep, getStepByIndex, getStepIndexById, waitForAnchor } from '../engine';
import { useSpotlightAnchor, useTutorialEligibility, useTutorialKeyboardShortcuts } from '../hooks';
import { freelancerTutorialSteps, FREELANCER_TUTORIAL_ID } from '../steps/freelancerSteps';
import { useOnboardingStore } from '../store';
import { TutorialOverlay } from './TutorialOverlay';

interface TutorialProviderProps {
  children?: ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();

  const {
    isHydrated,
    syncFromStorage,
    start,
    status,
    stepIndex,
    setStepIndex,
    next,
    prev,
    pause,
    dismiss,
    complete,
    markStepCompleted,
    records,
  } = useOnboardingStore();

  const { eligible, alreadyFinished } = useTutorialEligibility();
  const [anchorReady, setAnchorReady] = useState(false);
  const shouldRunTutorial = isAuthenticated && user?.role === 'freelancer';

  const currentStep = useMemo(
    () => getStepByIndex(freelancerTutorialSteps, stepIndex),
    [stepIndex]
  );
  const isTutorialVisible = shouldRunTutorial && status === 'active' && !!currentStep && anchorReady;
  const { rect } = useSpotlightAnchor(currentStep, isTutorialVisible);

  const loadExistingProgress = useCallback(
    (userId: string) => {
      const key = `${userId}:${FREELANCER_TUTORIAL_ID}`;
      const record = records[key];
      if (!record) return;
      const index = getStepIndexById(freelancerTutorialSteps, record.currentStepId);
      setStepIndex(index);
    },
    [records, setStepIndex]
  );

  useEffect(() => {
    if (!isHydrated || !user) return;
    syncFromStorage(user.id);
    loadExistingProgress(user.id);
  }, [isHydrated, loadExistingProgress, syncFromStorage, user]);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !user) return;
    if (!eligible || alreadyFinished) return;
    if (status === 'idle') start(user.id);
  }, [alreadyFinished, eligible, isAuthenticated, isHydrated, start, status, user]);

  useEffect(() => {
    let cancelled = false;

    async function prepareStep() {
      if (!shouldRunTutorial || !currentStep || status !== 'active') {
        setAnchorReady(false);
        return;
      }

      const isKycApproved = user?.kycStatus === 'approved';
      const accessible = canAccessStep(currentStep, isKycApproved);
      if (!accessible) {
        setStepIndex(0);
        return;
      }

      if (location.pathname !== currentStep.route) {
        navigate(currentStep.route);
        setAnchorReady(false);
        return;
      }

      const anchor = await waitForAnchor(currentStep);
      if (cancelled) return;

      if (!anchor && currentStep.guard?.skipIfMissing) {
        next();
        return;
      }

      setAnchorReady(true);
    }

    prepareStep();

    return () => {
      cancelled = true;
    };
  }, [currentStep, location.pathname, navigate, next, setStepIndex, shouldRunTutorial, status, user?.kycStatus]);

  const handleNext = useCallback(() => {
    if (!currentStep || !user) return;
    const isKycApproved = user.kycStatus === 'approved';
    if (currentStep.id !== 'kyc-verification' && currentStep.guard?.requiresKycApproved && !isKycApproved) {
      setStepIndex(0);
      return;
    }

    markStepCompleted(currentStep.id);
    if (stepIndex >= freelancerTutorialSteps.length - 1) {
      complete();
      return;
    }
    next();
  }, [complete, currentStep, markStepCompleted, next, setStepIndex, stepIndex, user]);

  const handlePrev = useCallback(() => {
    prev();
  }, [prev]);

  const handlePause = useCallback(() => {
    pause();
  }, [pause]);

  const handleSkip = useCallback(() => {
    dismiss('user_skip');
  }, [dismiss]);

  const handleBackdropDismiss = useCallback(() => {
    if (currentStep?.behavior.allowBackdropClose) {
      dismiss('user_close');
    }
  }, [currentStep?.behavior.allowBackdropClose, dismiss]);

  useTutorialKeyboardShortcuts({
    enabled: isTutorialVisible,
    onClose: handleBackdropDismiss,
    onNext: handleNext,
    onPrev: handlePrev,
  });

  return (
    <>
      {children}
      {isTutorialVisible && currentStep && (
        <TutorialOverlay
          step={currentStep}
          stepNumber={stepIndex + 1}
          totalSteps={freelancerTutorialSteps.length}
          targetRect={rect}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
          onPause={handlePause}
          onBackdropDismiss={handleBackdropDismiss}
        />
      )}
    </>
  );
}
