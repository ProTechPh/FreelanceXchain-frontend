import type { TutorialStep } from '../types';

export const FREELANCER_TUTORIAL_ID = 'freelancer_v1';
export const FREELANCER_TUTORIAL_VERSION = 1;

export const freelancerTutorialSteps: TutorialStep[] = [
  {
    id: 'kyc-verification',
    order: 1,
    title: 'KYC Verification',
    body: 'Verify your identity to unlock proposals, contracts, and secure escrow workflows.',
    route: '/kyc',
    role: 'freelancer',
    required: true,
    anchor: {
      selector: '[data-tour-id="kyc-start-card"]',
      fallbackSelector: 'main h1',
      placement: 'bottom',
      padding: 8,
    },
    behavior: {
      allowBackdropClose: true,
      allowSkip: true,
      blockInteraction: false,
      autoAdvanceOn: 'manual',
    },
    cta: {
      primaryLabel: 'Next',
      secondaryLabel: 'Resume later',
    },
  },
  {
    id: 'profile-skills',
    order: 2,
    title: 'Profile and Skills',
    body: 'Fill in your profile and add your core skills so employers and AI matching can find you.',
    route: '/profile',
    role: 'freelancer',
    anchor: {
      selector: '[data-tour-id="profile-skills-section"]',
      fallbackSelector: 'main h1',
      placement: 'right',
      padding: 8,
    },
    behavior: {
      allowBackdropClose: true,
      allowSkip: true,
      blockInteraction: false,
      autoAdvanceOn: 'manual',
    },
    cta: {
      primaryLabel: 'Next',
      secondaryLabel: 'Back',
    },
  },
  {
    id: 'skill-analysis',
    order: 3,
    title: 'Skill Analysis',
    body: 'Analyze your current strengths and identify high-demand skills to improve your match quality.',
    route: '/skill-analysis',
    role: 'freelancer',
    anchor: {
      selector: '[data-tour-id="skill-analysis-main"]',
      fallbackSelector: 'main h1',
      placement: 'bottom',
      padding: 8,
    },
    behavior: {
      allowBackdropClose: true,
      allowSkip: true,
      blockInteraction: false,
      autoAdvanceOn: 'manual',
    },
    guard: {
      requiresKycApproved: true,
    },
  },
  {
    id: 'ai-recommendations',
    order: 4,
    title: 'AI Recommendations',
    body: 'Use personalized project recommendations to prioritize the best-fit opportunities.',
    route: '/recommendations',
    role: 'freelancer',
    anchor: {
      selector: '[data-tour-id="recommendations-main"]',
      fallbackSelector: 'main h1',
      placement: 'bottom',
      padding: 8,
    },
    behavior: {
      allowBackdropClose: true,
      allowSkip: true,
      blockInteraction: false,
      autoAdvanceOn: 'manual',
    },
  },
  {
    id: 'proposals',
    order: 5,
    title: 'Proposals',
    body: 'Track submitted proposals, monitor status changes, and manage active applications.',
    route: '/proposals',
    role: 'freelancer',
    anchor: {
      selector: '[data-tour-id="proposals-main"]',
      fallbackSelector: 'main h1',
      placement: 'bottom',
      padding: 8,
    },
    behavior: {
      allowBackdropClose: true,
      allowSkip: true,
      blockInteraction: false,
      autoAdvanceOn: 'manual',
    },
    guard: {
      requiresKycApproved: true,
    },
  },
  {
    id: 'contracts',
    order: 6,
    title: 'My Contracts',
    body: 'Manage milestones, progress, and payment lifecycle for all active contracts.',
    route: '/contracts',
    role: 'freelancer',
    anchor: {
      selector: '[data-tour-id="contracts-main"]',
      fallbackSelector: 'main h1',
      placement: 'bottom',
      padding: 8,
    },
    behavior: {
      allowBackdropClose: true,
      allowSkip: true,
      blockInteraction: false,
      autoAdvanceOn: 'manual',
    },
    guard: {
      requiresKycApproved: true,
    },
  },
  {
    id: 'disputes',
    order: 7,
    title: 'Disputes',
    body: 'Open or track dispute cases and submit evidence when contract milestones are contested.',
    route: '/disputes',
    role: 'freelancer',
    anchor: {
      selector: '[data-tour-id="disputes-main"]',
      fallbackSelector: 'main h1',
      placement: 'bottom',
      padding: 8,
    },
    behavior: {
      allowBackdropClose: true,
      allowSkip: true,
      blockInteraction: false,
      autoAdvanceOn: 'manual',
    },
    guard: {
      requiresKycApproved: true,
    },
  },
  {
    id: 'browse-projects',
    order: 8,
    title: 'Browse Projects',
    body: 'Search and filter projects to quickly find opportunities that fit your skills and rates.',
    route: '/projects',
    role: 'freelancer',
    anchor: {
      selector: '[data-tour-id="projects-search"]',
      fallbackSelector: 'main h1',
      placement: 'bottom',
      padding: 8,
    },
    behavior: {
      allowBackdropClose: true,
      allowSkip: true,
      blockInteraction: false,
      autoAdvanceOn: 'manual',
    },
    guard: {
      requiresKycApproved: true,
    },
    cta: {
      primaryLabel: 'Finish',
      secondaryLabel: 'Back',
    },
  },
];
