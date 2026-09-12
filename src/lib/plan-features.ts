/**
 * What Pro actually buys, in one place.
 *
 * The comparison table on the pricing page is generated from PLAN_COMPARISON,
 * and plan-features.test.mjs asserts that every row marked Pro maps to a
 * genuinely gated endpoint. That is what stops the pricing page drifting into
 * claiming things that are not really gated.
 *
 * No React and no `@/…` runtime imports — this file runs under `node --test`.
 */

/** Every feature that can be locked behind a ProGate. */
export type ProFeature =
  | 'project-recommendations'
  | 'freelancer-recommendations'
  | 'skill-gaps'
  | 'extract-skills'
  | 'ai-proposal'
  | 'freelancer-analytics'
  | 'employer-analytics'
  | 'skill-trends';

export interface ProFeatureCopy {
  title: string;
  description: string;
  /** The API path this feature calls, so the tests can verify it is gated. */
  endpoint: string;
}

export const PRO_FEATURE_COPY: Record<ProFeature, ProFeatureCopy> = {
  'project-recommendations': {
    title: 'Project recommendations are a Pro feature',
    description: 'Get projects ranked against your skills and reputation, instead of browsing everything by hand.',
    endpoint: '/matching/projects',
  },
  'freelancer-recommendations': {
    title: 'Candidate recommendations are a Pro feature',
    description: 'See the freelancers who best match your project, ranked by skills and reputation.',
    endpoint: '/matching/freelancers',
  },
  'skill-gaps': {
    title: 'Skill gap analysis is a Pro feature',
    description: 'Find out which skills would win you more work, based on what the marketplace is actually hiring for.',
    endpoint: '/matching/skill-gaps',
  },
  'extract-skills': {
    title: 'AI skill extraction is a Pro feature',
    description: 'Turn a résumé, brief or job description into structured skills automatically.',
    endpoint: '/matching/extract-skills',
  },
  'ai-proposal': {
    title: 'Drafting with AI is a Pro feature',
    description: 'Generate a tailored first draft from your profile and the project brief, then edit it yourself.',
    endpoint: '/matching/generate-proposal',
  },
  'freelancer-analytics': {
    title: 'Your earnings analytics are a Pro feature',
    description: 'Track earnings, completion rate and trends over any date range.',
    endpoint: '/analytics/freelancer',
  },
  'employer-analytics': {
    title: 'Your hiring analytics are a Pro feature',
    description: 'Track spend, hiring velocity and project outcomes over any date range.',
    endpoint: '/analytics/employer',
  },
  'skill-trends': {
    title: 'Skill demand trends are a Pro feature',
    description: 'See which skills are rising and falling in demand across the marketplace.',
    endpoint: '/analytics/skill-trends',
  },
};

/** Endpoints the API gates behind Pro. Mirrors the server middleware. */
export const PRO_ONLY_ENDPOINTS: readonly string[] = [
  '/matching/projects',
  '/matching/freelancers',
  '/matching/extract-skills',
  '/matching/skill-gaps',
  '/matching/generate-proposal',
  '/analytics/freelancer',
  '/analytics/employer',
  '/analytics/skill-trends',
];

/**
 * Endpoints that stay free. Listed explicitly so a test can assert the pricing
 * page never sells something that is not actually gated.
 */
export const FREE_ENDPOINTS: readonly string[] = [
  '/analytics/platform',
  '/analytics/liquidity',
  '/analytics/funnel',
  '/dashboard',
];

export interface PlanComparisonRow {
  feature: string;
  free: boolean;
  pro: boolean;
  /** Set on Pro-only rows so the test can check the claim against an endpoint. */
  endpoint?: string;
}

export const PLAN_COMPARISON: readonly PlanComparisonRow[] = [
  { feature: 'Browse and search projects, saved searches, favourites', free: true, pro: true },
  { feature: 'Post projects and receive proposals', free: true, pro: true },
  { feature: 'Submit proposals you write yourself', free: true, pro: true },
  { feature: 'Smart-contract escrow, milestones, releases and refunds', free: true, pro: true },
  { feature: 'Messaging, notifications, disputes and evidence', free: true, pro: true },
  { feature: 'Reputation, reviews and your public profile', free: true, pro: true },
  { feature: 'Identity verification (KYC)', free: true, pro: true },
  { feature: 'Marketplace stats — platform activity, liquidity, funnel', free: true, pro: true },
  { feature: 'AI project recommendations', free: false, pro: true, endpoint: '/matching/projects' },
  { feature: 'AI candidate recommendations', free: false, pro: true, endpoint: '/matching/freelancers' },
  { feature: 'Draft a proposal with AI', free: false, pro: true, endpoint: '/matching/generate-proposal' },
  { feature: 'Skill gap analysis', free: false, pro: true, endpoint: '/matching/skill-gaps' },
  { feature: 'Extract skills from a résumé or brief', free: false, pro: true, endpoint: '/matching/extract-skills' },
  { feature: 'Your earnings and spend analytics, with date ranges', free: false, pro: true, endpoint: '/analytics/freelancer' },
  { feature: 'Skill demand trends', free: false, pro: true, endpoint: '/analytics/skill-trends' },
  { feature: 'Priority matching — you\'re among the first matched to new projects', free: false, pro: true },
];

/**
 * Shown under the comparison table. These exist to keep the page honest about
 * what Pro does and does not change.
 */
export const PLAN_FOOTNOTES: readonly string[] = [
  'Priority matching affects how soon you are surfaced, not whether you are chosen. It does not guarantee a match or a hire.',
  'Escrow and platform fees are the same on both plans. Pro does not change what you earn or pay per contract.',
  "Cancel any time. You keep Pro until the end of the period you've paid for.",
];
