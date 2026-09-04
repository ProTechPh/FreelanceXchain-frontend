import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  TOUR_STORAGE_KEY,
  clampStepIndex,
  getStepIndexById,
  getTourSteps,
  isTourRole,
  markCompleted,
  setTourAutoStart,
  type TourProgressByUser,
} from '@/lib/onboarding-tour';
import type { UserRole } from '@/types';

interface TourState {
  /** Per-account completion and auto-start preferences. */
  progressByUser: TourProgressByUser;
  /** Application-level default; production keeps this enabled. */
  autoStartByDefault: boolean;
  isRunning: boolean;
  stepIndex: number;
  /** The role the running tour is teaching. */
  activeRole: UserRole | null;
  /** The account whose progress the running tour will update. */
  activeUserId: string | null;
  /**
   * A start that is waiting on navigation. Replaying from Settings has to reach
   * the dashboard home first, because that is where the CTA and active-work
   * anchors live -- starting in place would spotlight nothing.
   */
  pendingRole: UserRole | null;
  pendingUserId: string | null;
  /** The step a pending start should open on. */
  pendingStepId: string | null;
  /**
   * Measured height of the docked step card, in px.
   *
   * Published so the navigation drawer can end exactly above it instead of
   * guessing at a percentage and leaving dead space on a tall screen.
   */
  cardHeight: number;
  /** Mirrors the auth store: guards against acting before rehydration. */
  hasHydrated: boolean;

  start: (userId: string | undefined | null, role: UserRole | undefined | null, stepId?: string) => void;
  /** Start once the dashboard home is reached. */
  requestStart: (userId: string | undefined | null, role: UserRole | undefined | null, stepId?: string) => void;
  clearPending: () => void;
  next: () => void;
  back: () => void;
  goTo: (index: number) => void;
  /** Leave early. Still records completion so it does not reappear uninvited. */
  skip: () => void;
  finish: () => void;
  setAutoStart: (userId: string | undefined | null, role: UserRole | undefined | null, value: boolean) => void;
  setCardHeight: (value: number) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      progressByUser: {},
      autoStartByDefault: true,
      isRunning: false,
      stepIndex: 0,
      activeRole: null,
      activeUserId: null,
      pendingRole: null,
      pendingUserId: null,
      pendingStepId: null,
      cardHeight: 0,
      hasHydrated: false,

      start: (userId, role, stepId) => {
        if (!userId || !isTourRole(role) || getTourSteps(role).length === 0) return;
        set({
          isRunning: true,
          stepIndex: getStepIndexById(role, stepId),
          activeRole: role,
          activeUserId: userId,
          pendingRole: null,
          pendingUserId: null,
          pendingStepId: null,
        });
      },

      requestStart: (userId, role, stepId) => {
        if (!userId || !isTourRole(role) || getTourSteps(role).length === 0) return;
        set({ pendingRole: role, pendingUserId: userId, pendingStepId: stepId ?? null });
      },

      clearPending: () => set({ pendingRole: null, pendingUserId: null, pendingStepId: null }),

      next: () => {
        const { stepIndex, activeRole } = get();
        const total = getTourSteps(activeRole).length;
        if (stepIndex >= total - 1) {
          get().finish();
          return;
        }
        set({ stepIndex: stepIndex + 1 });
      },

      back: () => {
        const { stepIndex } = get();
        set({ stepIndex: Math.max(0, stepIndex - 1) });
      },

      goTo: (index) => {
        const { activeRole } = get();
        set({ stepIndex: clampStepIndex(index, getTourSteps(activeRole).length) });
      },

      skip: () => {
        const { activeRole, activeUserId, progressByUser } = get();
        set({
          isRunning: false,
          stepIndex: 0,
          activeRole: null,
          activeUserId: null,
          pendingRole: null,
          pendingUserId: null,
          pendingStepId: null,
          cardHeight: 0,
          progressByUser: markCompleted(progressByUser, activeUserId, activeRole),
        });
      },

      finish: () => {
        const { activeRole, activeUserId, progressByUser } = get();
        set({
          isRunning: false,
          stepIndex: 0,
          activeRole: null,
          activeUserId: null,
          pendingRole: null,
          pendingUserId: null,
          pendingStepId: null,
          cardHeight: 0,
          progressByUser: markCompleted(progressByUser, activeUserId, activeRole),
        });
      },

      setAutoStart: (userId, role, value) => set((state) => ({
        progressByUser: setTourAutoStart(state.progressByUser, userId, role, value),
      })),

      setCardHeight: (value: number) => {
        // Sub-pixel churn from a ResizeObserver would re-render the drawer on
        // every frame of the card's entrance animation.
        if (Math.abs(get().cardHeight - value) < 1) return;
        set({ cardHeight: value });
      },

      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
    }),
    {
      name: TOUR_STORAGE_KEY,
      // Only the durable preferences persist. Whether a tour is mid-flight is
      // deliberately not restored across a reload.
      partialize: (state) => ({
        progressByUser: state.progressByUser,
        autoStartByDefault: state.autoStartByDefault,
      }),
      version: 1,
      migrate: (persistedState, version) => {
        if (version < 1) return { progressByUser: {}, autoStartByDefault: true };
        return persistedState as TourState;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
