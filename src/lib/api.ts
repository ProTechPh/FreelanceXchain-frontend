/**
 * Central API client entry point and re-exports.
 * Concrete domain clients are modularized under `@/lib/api/*`.
 */

export { default, api, API_URL } from './api-client';

export {
  authApi,
  emailPreferencesApi,
  userPreferencesApi,
  type UserPreferences,
} from './api/auth';

export {
  freelancersApi,
  employersApi,
  portfolioApi,
} from './api/profiles';

export {
  projectsApi,
  proposalsApi,
  favoritesApi,
  savedSearchesApi,
  skillsApi,
} from './api/projects';

export {
  contractsApi,
  rushUpgradesApi,
  refundsApi,
  milestonesApi,
  paymentsApi,
  transactionsApi,
} from './api/contracts';

export { disputesApi } from './api/disputes';

export { appRatingsApi } from './api/app-ratings';

export {
  messagesApi,
  notificationsApi,
  emailApi,
  type SenderProfile,
} from './api/communications';

export {
  adminApi,
  auditLogsApi,
  analyticsApi,
  fileManagementApi,
  fileUploadsApi,
} from './api/admin';

export {
  reputationApi,
  reviewsApi,
  matchingApi,
  billingApi,
  kycApi,
  cryptoNewsApi,
  type ProjectRecommendation,
  type FreelancerRecommendation,
  type ExtractedSkill,
  type SkillGapAnalysis,
  type ProposalMilestonePlan,
  type AIProposalResult,
} from './api/features';
