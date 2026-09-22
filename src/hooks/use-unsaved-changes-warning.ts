'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const UNLOAD_MESSAGE = 'You have unsaved changes.';

type UnsavedChangesOptions = {
  /**
   * Wired to the dialog's "Save and leave" action. Resolve `true` when the save
   * succeeded so navigation may continue, `false` to stay on the page.
   * Omitting it hides that action.
   */
  onSave?: () => Promise<boolean>;
};

export type UnsavedChangesGuard = {
  /** True while the confirmation dialog should be open. */
  isPrompting: boolean;
  /** Where the person was heading, for display in the dialog. */
  pendingUrl: string | null;
  /** Dismiss the dialog and stay put. */
  keepEditing: () => void;
  /** Continue to the pending route and drop the edits. */
  discardAndLeave: () => void;
  /** Persist first, then continue. `null` when no `onSave` was supplied. */
  saveAndLeave: (() => Promise<void>) | null;
};

/**
 * Guards a page that holds unsaved form changes.
 *
 * In-app navigation is intercepted at the click, before the router runs, so the
 * app can show its own dialog. A real reload or tab close still goes through the
 * browser's native prompt — that wording and styling belong to the browser and
 * cannot be replaced.
 *
 * @param isDirty - Whether the form has unsaved changes.
 * @param options - Optional save handler for the dialog's "Save and leave".
 */
export function useUnsavedChangesWarning(
  isDirty: boolean,
  options: UnsavedChangesOptions = {},
): UnsavedChangesGuard {
  const router = useRouter();
  const { onSave } = options;
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const navigationAllowed = useRef(false);

  useEffect(() => {
    if (!isDirty) return;

    const warnOnUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = UNLOAD_MESSAGE;
    };

    window.addEventListener('beforeunload', warnOnUnload);
    return () => window.removeEventListener('beforeunload', warnOnUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;

    // Capture phase: this has to win over the router's own click handler, which
    // is why the event is also stopped from propagating.
    const interceptNavigation = (event: MouseEvent) => {
      if (navigationAllowed.current || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname) return;

      event.preventDefault();
      event.stopPropagation();
      setPendingUrl(`${destination.pathname}${destination.search}`);
    };

    document.addEventListener('click', interceptNavigation, true);
    return () => document.removeEventListener('click', interceptNavigation, true);
  }, [isDirty]);

  const leave = useCallback(
    (url: string) => {
      navigationAllowed.current = true;
      setPendingUrl(null);
      router.push(url);
    },
    [router],
  );

  const keepEditing = useCallback(() => setPendingUrl(null), []);

  const discardAndLeave = useCallback(() => {
    if (pendingUrl) leave(pendingUrl);
  }, [leave, pendingUrl]);

  const saveAndLeave = useCallback(async () => {
    if (!onSave || !pendingUrl) return;
    const destination = pendingUrl;
    if (await onSave()) leave(destination);
  }, [leave, onSave, pendingUrl]);

  return {
    isPrompting: pendingUrl !== null,
    pendingUrl,
    keepEditing,
    discardAndLeave,
    saveAndLeave: onSave ? saveAndLeave : null,
  };
}
