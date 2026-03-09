import type { UserRole } from '../../../types';
import type { TutorialId, TutorialStep } from '../types';
import {
  employerTutorialSteps,
  EMPLOYER_TUTORIAL_ID,
  EMPLOYER_TUTORIAL_VERSION,
} from './employerSteps';
import {
  freelancerTutorialSteps,
  FREELANCER_TUTORIAL_ID,
  FREELANCER_TUTORIAL_VERSION,
} from './freelancerSteps';

interface TutorialConfig {
  id: TutorialId;
  version: number;
  role: 'freelancer' | 'employer';
  steps: TutorialStep[];
}

const tutorialsById: Record<TutorialId, TutorialConfig> = {
  [FREELANCER_TUTORIAL_ID]: {
    id: FREELANCER_TUTORIAL_ID,
    version: FREELANCER_TUTORIAL_VERSION,
    role: 'freelancer',
    steps: freelancerTutorialSteps,
  },
  [EMPLOYER_TUTORIAL_ID]: {
    id: EMPLOYER_TUTORIAL_ID,
    version: EMPLOYER_TUTORIAL_VERSION,
    role: 'employer',
    steps: employerTutorialSteps,
  },
};

export function getTutorialConfigByRole(role?: UserRole | null): TutorialConfig | null {
  if (role === 'freelancer') {
    return tutorialsById[FREELANCER_TUTORIAL_ID];
  }

  if (role === 'employer') {
    return tutorialsById[EMPLOYER_TUTORIAL_ID];
  }

  return null;
}

export function getTutorialVersion(tutorialId: TutorialId): number {
  return tutorialsById[tutorialId].version;
}
