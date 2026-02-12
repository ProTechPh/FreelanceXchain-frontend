export type TutorialId = 'freelancer_v1';

export type TutorialStatus =
  | 'idle'
  | 'active'
  | 'paused'
  | 'completed'
  | 'dismissed';

export type TutorialProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'dismissed';

export type AnchorPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface TutorialStep {
  id: string;
  order: number;
  title: string;
  body: string;
  route: string;
  role: 'freelancer';
  required?: boolean;
  anchor: {
    selector: string;
    fallbackSelector?: string;
    placement: AnchorPlacement;
    padding?: number;
  };
  behavior: {
    allowBackdropClose: boolean;
    allowSkip: boolean;
    blockInteraction: boolean;
    autoAdvanceOn?: 'route_change' | 'element_click' | 'manual' | 'kyc_approved';
  };
  guard?: {
    requiresKycApproved?: boolean;
    waitForElementMs?: number;
    skipIfMissing?: boolean;
  };
  cta?: {
    primaryLabel?: string;
    secondaryLabel?: string;
  };
}

export interface OnboardingProgressRecord {
  userId: string;
  tutorialId: TutorialId;
  version: number;
  status: TutorialProgressStatus;
  currentStepId?: string;
  completedStepIds: string[];
  dismissedAt?: string;
  completedAt?: string;
  updatedAt: string;
}
