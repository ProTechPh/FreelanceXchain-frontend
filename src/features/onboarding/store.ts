import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  OnboardingProgressRecord,
  TutorialId,
  TutorialProgressStatus,
  TutorialStatus,
} from './types';
import { FREELANCER_TUTORIAL_ID, FREELANCER_TUTORIAL_VERSION } from './steps/freelancerSteps';

interface OnboardingState {
  status: TutorialStatus;
  tutorialId: TutorialId;
  stepIndex: number;
  activeUserId?: string;
  records: Record<string, OnboardingProgressRecord>;
  isHydrated: boolean;
  start: (userId: string) => void;
  pause: () => void;
  resume: () => void;
  dismiss: (reason?: 'user_skip' | 'user_close' | 'system') => void;
  complete: () => void;
  next: () => void;
  prev: () => void;
  setStepIndex: (index: number) => void;
  markStepCompleted: (stepId: string) => void;
  syncFromStorage: (userId: string) => void;
  restart: (userId: string) => void;
  setHydrated: (value: boolean) => void;
}

function getRecordKey(userId: string, tutorialId: TutorialId) {
  return `${userId}:${tutorialId}`;
}

function getNow() {
  return new Date().toISOString();
}

function getInitialRecord(userId: string): OnboardingProgressRecord {
  return {
    userId,
    tutorialId: FREELANCER_TUTORIAL_ID,
    version: FREELANCER_TUTORIAL_VERSION,
    status: 'not_started',
    completedStepIds: [],
    updatedAt: getNow(),
  };
}

function toRuntimeStatus(status: TutorialProgressStatus): TutorialStatus {
  if (status === 'completed') return 'completed';
  if (status === 'dismissed') return 'dismissed';
  if (status === 'in_progress') return 'active';
  return 'idle';
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      tutorialId: FREELANCER_TUTORIAL_ID,
      stepIndex: 0,
      activeUserId: undefined,
      records: {},
      isHydrated: false,

      setHydrated: (value: boolean) => set({ isHydrated: value }),

      syncFromStorage: (userId: string) => {
        const state = get();
        const key = getRecordKey(userId, state.tutorialId);
        const existing = state.records[key];
        if (!existing) {
          set({ activeUserId: userId, status: 'idle', stepIndex: 0 });
          return;
        }

        const stepIndex = 0;
        set({
          activeUserId: userId,
          status: toRuntimeStatus(existing.status),
          stepIndex,
        });
      },

      start: (userId: string) => {
        const state = get();
        const key = getRecordKey(userId, state.tutorialId);
        const existing = state.records[key] ?? getInitialRecord(userId);

        const nextRecord: OnboardingProgressRecord = {
          ...existing,
          status: 'in_progress',
          updatedAt: getNow(),
        };

        set({
          activeUserId: userId,
          status: 'active',
          stepIndex: 0,
          records: {
            ...state.records,
            [key]: nextRecord,
          },
        });
      },

      pause: () => set({ status: 'paused' }),

      resume: () => {
        if (get().status === 'paused') {
          set({ status: 'active' });
        }
      },

      dismiss: () => {
        const state = get();
        if (!state.activeUserId) return;
        const key = getRecordKey(state.activeUserId, state.tutorialId);
        const existing = state.records[key] ?? getInitialRecord(state.activeUserId);
        const now = getNow();

        set({
          status: 'dismissed',
          records: {
            ...state.records,
            [key]: {
              ...existing,
              status: 'dismissed',
              dismissedAt: now,
              updatedAt: now,
            },
          },
        });
      },

      complete: () => {
        const state = get();
        if (!state.activeUserId) return;
        const key = getRecordKey(state.activeUserId, state.tutorialId);
        const existing = state.records[key] ?? getInitialRecord(state.activeUserId);
        const now = getNow();

        set({
          status: 'completed',
          records: {
            ...state.records,
            [key]: {
              ...existing,
              status: 'completed',
              completedAt: now,
              updatedAt: now,
            },
          },
        });
      },

      next: () => set((state) => ({ stepIndex: state.stepIndex + 1 })),
      prev: () => set((state) => ({ stepIndex: Math.max(0, state.stepIndex - 1) })),
      setStepIndex: (index: number) => set({ stepIndex: Math.max(0, index) }),

      markStepCompleted: (stepId: string) => {
        const state = get();
        if (!state.activeUserId) return;
        const key = getRecordKey(state.activeUserId, state.tutorialId);
        const existing = state.records[key] ?? getInitialRecord(state.activeUserId);
        const completedStepIds = existing.completedStepIds.includes(stepId)
          ? existing.completedStepIds
          : [...existing.completedStepIds, stepId];

        set({
          records: {
            ...state.records,
            [key]: {
              ...existing,
              status: 'in_progress',
              currentStepId: stepId,
              completedStepIds,
              updatedAt: getNow(),
            },
          },
        });
      },

      restart: (userId: string) => {
        const key = getRecordKey(userId, FREELANCER_TUTORIAL_ID);
        const fresh = getInitialRecord(userId);

        set((state) => ({
          activeUserId: userId,
          status: 'active',
          stepIndex: 0,
          records: {
            ...state.records,
            [key]: {
              ...fresh,
              status: 'in_progress',
              updatedAt: getNow(),
            },
          },
        }));
      },
    }),
    {
      name: 'onboarding-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
