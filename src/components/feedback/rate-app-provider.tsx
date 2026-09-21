'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { RateAppDialog } from './rate-app-dialog';
import { appRatingsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import {
  DISMISSAL_STORAGE_KEY,
  parseDismissals,
  recordDismissal,
  shouldPromptFor,
  type AppRatingSource,
  type Dismissal,
} from '@/lib/app-rating-prompt';

/**
 * How long to wait after a success before asking.
 *
 * Long enough for the success toast to be read and for the page to settle, so
 * the prompt reads as a reaction to what just happened rather than as an
 * interruption of it.
 */
const PROMPT_DELAY_MS = 2000;

type RateAppContextValue = {
  /** Ask, if the user is due to be asked. Safe to call on every render path. */
  requestRatingPrompt: (source: AppRatingSource, contextId?: string) => void;
  /** Open the form regardless of cooldowns — the user asked for it. */
  openRatingDialog: (source?: AppRatingSource) => void;
  /** Used by `useSuppressRatingPrompt`; not called directly. */
  setSuppressed: (suppressed: boolean) => void;
};

const RateAppContext = createContext<RateAppContextValue | null>(null);

/**
 * Consumers get no-ops outside the provider, so a component can call
 * `requestRatingPrompt` without caring whether it is inside a dashboard.
 */
const NOOP_VALUE: RateAppContextValue = {
  requestRatingPrompt: () => {},
  openRatingDialog: () => {},
  setSuppressed: () => {},
};

export function useRateApp(): RateAppContextValue {
  return useContext(RateAppContext) ?? NOOP_VALUE;
}

/**
 * Let a subtree silence the prompt while it is mounted.
 *
 * The provider sits at the app root so it also covers the public project pages,
 * where a freelancer can submit a proposal. Only the dashboard knows about the
 * email-verification and KYC gates, so it reports that state up rather than
 * owning the provider.
 */
export function useSuppressRatingPrompt(suppressed: boolean): void {
  const { setSuppressed } = useRateApp();
  useEffect(() => {
    setSuppressed(suppressed);
    return () => setSuppressed(false);
  }, [suppressed, setSuppressed]);
}

function readDismissals(): Dismissal[] {
  try {
    return parseDismissals(window.localStorage.getItem(DISMISSAL_STORAGE_KEY));
  } catch {
    // Private windows and blocked site data both throw here. Treating that as
    // "nothing dismissed" is the safe direction: the server cooldown still
    // caps how often anyone is actually asked.
    return [];
  }
}

function writeDismissals(dismissals: Dismissal[]): void {
  try {
    window.localStorage.setItem(DISMISSAL_STORAGE_KEY, JSON.stringify(dismissals));
  } catch {
    // Nothing to do — a lost write can only cause one extra prompt later.
  }
}

type PromptState = {
  open: boolean;
  source: AppRatingSource;
  contextId?: string | undefined;
};

export function RateAppProvider({ children }: { children: React.ReactNode }) {
  const userId = useAuthStore((state) => state.user?.id);
  const [prompt, setPrompt] = useState<PromptState>({ open: false, source: 'manual' });
  const [suppressed, setSuppressed] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards against two triggers firing in the same tick (a milestone approval
  // that also completes the contract, for instance).
  const pendingRef = useRef(false);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const requestRatingPrompt = useCallback(
    (source: AppRatingSource, contextId?: string) => {
      if (!userId || suppressed || pendingRef.current) return;
      if (!shouldPromptFor(source, contextId, readDismissals())) return;

      pendingRef.current = true;

      void appRatingsApi
        .getEligibility()
        .then(({ data }) => {
          if (!data.shouldPrompt) {
            pendingRef.current = false;
            return;
          }
          timerRef.current = setTimeout(() => {
            setPrompt({ open: true, source, contextId });
          }, PROMPT_DELAY_MS);
        })
        .catch(() => {
          // Eligibility is advisory. If we cannot reach it, stay quiet rather
          // than risk asking someone who answered last week.
          pendingRef.current = false;
        });
    },
    [userId, suppressed],
  );

  const openRatingDialog = useCallback((source: AppRatingSource = 'manual') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPrompt({ open: true, source, contextId: undefined });
  }, []);

  const value = useMemo(
    () => ({ requestRatingPrompt, openRatingDialog, setSuppressed }),
    [requestRatingPrompt, openRatingDialog],
  );

  return (
    <RateAppContext.Provider value={value}>
      {children}
      <RateAppDialog
        open={prompt.open}
        source={prompt.source}
        contextId={prompt.contextId}
        onOpenChange={(open) => setPrompt((current) => ({ ...current, open }))}
        onDismiss={() => {
          pendingRef.current = false;
          // A form the user opened themselves and closed is not a dismissal —
          // there is nothing to suppress.
          if (prompt.source === 'manual') return;
          writeDismissals(recordDismissal(readDismissals(), prompt.source, prompt.contextId));
        }}
        onSubmitted={() => {
          pendingRef.current = false;
        }}
      />
    </RateAppContext.Provider>
  );
}
