'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Warns users before they leave a page with unsaved form changes.
 *
 * @param isDirty - Whether the form has unsaved changes
 * @param message - The warning message to display
 */
export function useUnsavedChangesWarning(
  isDirty: boolean,
  message = 'You have unsaved changes. Are you sure you want to leave?',
) {
  const shouldWarn = useRef(false);

  // Warn on browser navigation (refresh, close tab)
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, message]);

  useEffect(() => {
    if (!isDirty) return;

    // Use a ref to track if we should block navigation
    shouldWarn.current = true;

    // Intercept pushState/replaceState for programmatic navigation
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      if (shouldWarn.current && !window.confirm(message)) {
        return;
      }
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      return originalReplaceState.apply(this, args);
    };

    return () => {
      shouldWarn.current = false;
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [isDirty, message]);
}

/**
 * Convenience hook: returns a `markSaved` function to call after successful save,
 * plus the current dirty state.
 */
export function useDirtyFormTracker(initialValues: Record<string, unknown>) {
  const [savedValues, setSavedValues] = useState(initialValues);
  const [trackedValues, setTrackedValues] = useState(initialValues);

  const isDirty = JSON.stringify(savedValues) !== JSON.stringify(trackedValues);

  const markSaved = useCallback(() => {
    setSavedValues({ ...trackedValues });
  }, [trackedValues]);

  const updateValues = useCallback((newValues: Record<string, unknown>) => {
    setTrackedValues((prev) => ({ ...prev, ...newValues }));
  }, []);

  return { isDirty, markSaved, updateValues };
}
