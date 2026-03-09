import type { TutorialStep } from '../types';

export const EMPLOYER_TUTORIAL_ID = 'employer_v1';
export const EMPLOYER_TUTORIAL_VERSION = 1;

export const employerTutorialSteps: TutorialStep[] = [
  {
    id: 'kyc-verification',
    order: 1,
    title: 'KYC Verification',
    body: 'Complete identity verification first so you can create projects, manage contracts, and hire safely.',
    route: '/kyc',
    role: 'employer',
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
  },
  {
    id: 'profile',
    order: 2,
    title: 'Profile',
    body: 'Set up your company profile so freelancers understand your business and project needs.',
    route: '/profile',
    role: 'employer',
    anchor: {
      selector: '[data-tour-id="employer-profile-section"]',
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
  },
  {
    id: 'connect-wallet',
    order: 3,
    title: 'Connect Wallet',
    body: 'Connect your wallet to fund escrow and pay freelancers securely through smart contracts.',
    route: '/wallet',
    role: 'employer',
    anchor: {
      selector: '[data-tour-id="wallet-main"]',
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
    id: 'create-projects',
    order: 4,
    title: 'Create Projects',
    body: 'Create a project with scope, budget, and milestones to start receiving qualified proposals.',
    route: '/projects/new',
    role: 'employer',
    anchor: {
      selector: '[data-tour-id="create-project-main"]',
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
    id: 'my-projects',
    order: 5,
    title: 'My Projects',
    body: 'Review all projects you posted, track status, and manage project activity in one place.',
    route: '/projects/manage',
    role: 'employer',
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
  },
  {
    id: 'disputes',
    order: 6,
    title: 'Disputes',
    body: 'Handle open disputes, submit evidence, and track resolution outcomes for your contracts.',
    route: '/disputes',
    role: 'employer',
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
    id: 'browse-freelancer',
    order: 7,
    title: 'Browse Freelancer',
    body: 'Search freelancers by skill, rate, and availability to find the best fit for your projects.',
    route: '/freelancers',
    role: 'employer',
    anchor: {
      selector: '[data-tour-id="freelancers-search"]',
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
