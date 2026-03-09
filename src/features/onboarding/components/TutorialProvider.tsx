import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store';
import { canAccessStep, getStepByIndex, getStepIndexById, waitForAnchor } from '../engine';
import { useSpotlightAnchor, useTutorialEligibility, useTutorialKeyboardShortcuts } from '../hooks';
import { getTutorialConfigByRole } from '../steps/tutorials';
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
    tutorialId: activeTutorialId,
    setTutorialId,
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

  const tutorialConfig = useMemo(() => getTutorialConfigByRole(user?.role), [user?.role]);
  const selectedTutorialId = tutorialConfig?.id ?? null;
  const tutorialSteps = tutorialConfig?.steps ?? [];
  const { eligible, alreadyFinished } = useTutorialEligibility(selectedTutorialId);
  const [anchorReady, setAnchorReady] = useState(false);
  const shouldRunTutorial = isAuthenticated && !!tutorialConfig;
  const tutorialContextReady = shouldRunTutorial && !!selectedTutorialId && selectedTutorialId === activeTutorialId;

  useEffect(() => {
    if (!selectedTutorialId) return;
    setTutorialId(selectedTutorialId);
  }, [selectedTutorialId, setTutorialId]);

  const currentStep = useMemo(
    () => getStepByIndex(tutorialSteps, stepIndex),
    [stepIndex, tutorialSteps]
  );
  const isTutorialVisible = tutorialContextReady && status === 'active' && !!currentStep && anchorReady;
  const { rect } = useSpotlightAnchor(currentStep, isTutorialVisible);

  const loadExistingProgress = useCallback(
    (userId: string) => {
      if (!selectedTutorialId) return;
      const key = `${userId}:${selectedTutorialId}`;
      const record = records[key];
      if (!record) return;
      const index = getStepIndexById(tutorialSteps, record.currentStepId);
      setStepIndex(index);
    },
    [records, selectedTutorialId, setStepIndex, tutorialSteps]
  );

  useEffect(() => {
    if (!isHydrated || !user || !selectedTutorialId || !tutorialContextReady) return;
    console.log('[TutorialProvider] syncFromStorage effect triggered', {
      userId: user.id,
      tutorialId: selectedTutorialId,
      currentStatus: status,
      currentStepIndex: stepIndex
    });
    // Only sync from storage if tutorial is not currently active
    // to prevent resetting progress during active tutorial
    if (status !== 'active') {
      syncFromStorage(user.id);
      loadExistingProgress(user.id);
    }
  }, [
    isHydrated,
    loadExistingProgress,
    selectedTutorialId,
    status,
    stepIndex,
    syncFromStorage,
    tutorialContextReady,
    user,
  ]);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !user || !tutorialContextReady) return;
    if (!eligible || alreadyFinished) return;
    if (status === 'idle') start(user.id);
  }, [
    alreadyFinished,
    eligible,
    isAuthenticated,
    isHydrated,
    start,
    status,
    tutorialContextReady,
    user,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function prepareStep() {
      console.log('[TutorialProvider] prepareStep called', {
        shouldRunTutorial,
        tutorialContextReady,
        currentStepId: currentStep?.id,
        stepIndex,
        status,
        pathname: location.pathname,
        kycStatus: user?.kycStatus
      });

      if (!tutorialContextReady || !currentStep || status !== 'active') {
        console.log('[TutorialProvider] prepareStep: not running tutorial');
        setAnchorReady(false);
        return;
      }

      const isKycApproved = user?.kycStatus === 'approved';
      const accessible = canAccessStep(currentStep, isKycApproved);
      console.log('[TutorialProvider] prepareStep: accessibility check', { accessible, isKycApproved, requiresKyc: currentStep.guard?.requiresKycApproved });
      
      if (!accessible) {
        console.log('[TutorialProvider] prepareStep: step not accessible, resetting to 0');
        setStepIndex(0);
        return;
      }

      if (location.pathname !== currentStep.route) {
        console.log('[TutorialProvider] prepareStep: navigating to', currentStep.route);
        navigate(currentStep.route);
        setAnchorReady(false);
        return;
      }

      console.log('[TutorialProvider] prepareStep: waiting for anchor', currentStep.anchor.selector);
      const anchor = await waitForAnchor(currentStep);
      if (cancelled) {
        console.log('[TutorialProvider] prepareStep: cancelled');
        return;
      }

      if (!anchor && currentStep.guard?.skipIfMissing) {
        console.log('[TutorialProvider] prepareStep: anchor missing, auto-advancing');
        next();
        return;
      }

      console.log('[TutorialProvider] prepareStep: anchor ready', { found: !!anchor });
      setAnchorReady(true);
    }

    prepareStep();

    return () => {
      cancelled = true;
    };
  }, [
    currentStep,
    location.pathname,
    navigate,
    next,
    setStepIndex,
    shouldRunTutorial,
    status,
    tutorialContextReady,
    user?.kycStatus,
  ]);

  const handleNext = useCallback(() => {
    console.log('[TutorialProvider] handleNext called', {
      currentStepId: currentStep?.id,
      stepIndex,
      userId: user?.id,
      kycStatus: user?.kycStatus
    });
    
    if (!currentStep || !user) {
      console.log('[TutorialProvider] handleNext: missing currentStep or user');
      return;
    }
    
    const isKycApproved = user.kycStatus === 'approved';
    if (currentStep.id !== 'kyc-verification' && currentStep.guard?.requiresKycApproved && !isKycApproved) {
      console.log('[TutorialProvider] handleNext: resetting to step 0 due to KYC guard');
      setStepIndex(0);
      return;
    }

    console.log('[TutorialProvider] handleNext: marking step completed and advancing');
    markStepCompleted(currentStep.id);
    if (stepIndex >= tutorialSteps.length - 1) {
      console.log('[TutorialProvider] handleNext: completing tutorial');
      complete();
      return;
    }
    console.log('[TutorialProvider] handleNext: calling next() to advance step');
    next();
  }, [complete, currentStep, markStepCompleted, next, setStepIndex, stepIndex, tutorialSteps.length, user]);

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
          totalSteps={tutorialSteps.length}
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
