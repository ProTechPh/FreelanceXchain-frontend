import api from '@/lib/api-client';
import type {
  AggregatedReputationScore,
  ReputationBreakdown,
  ReputationHistoryEntry,
  ReputationMetadata,
  ReputationWorkHistoryEntry,
  ReputationLeaderboardEntry,
  Review,
  Subscription,
  BillingPlansResponse,
  BillingInterval,
  CheckoutSessionResponse,
  BillingRedirect,
  KycVerification,
  KycDecisionDetails,
  CryptoNewsFeed,
  CryptoNewsArticle,
  CryptoPricesResponse,
  FearGreedIndexData,
  GlobalMarketStats,
  CryptoMarketMoversResponse,
} from '@/types';

export interface ProjectRecommendation {
  projectId: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
}

export interface FreelancerRecommendation {
  freelancerId: string;
  matchScore: number;
  reputationScore: number;
  averageRating?: number;
  totalRatings?: number;
  combinedScore: number;
  matchedSkills: string[];
  reasoning: string;
}

export interface ExtractedSkill {
  skillId: string;
  skillName: string;
  confidence: number;
}

export interface SkillGapAnalysis {
  currentSkills: string[];
  recommendedSkills: string[];
  marketDemand: Array<{ skillName: string; demandLevel: 'high' | 'medium' | 'low' }>;
  reasoning: string;
}

export interface ProposalMilestonePlan {
  title: string;
  description: string;
  amount: number;
  durationDays: number;
}

export interface AIProposalResult {
  coverLetter: string;
  proposedRate: number;
  estimatedDuration: number;
  proposedMilestones: ProposalMilestonePlan[];
  highlights: string[];
}

export const reputationApi = {
  getScore: (userId: string) =>
    api.get<AggregatedReputationScore>(`/reputation/${userId}/score`),

  getBreakdown: (userId: string) =>
    api.get<ReputationBreakdown>(`/reputation/${userId}/breakdown`),

  getHistory: (userId: string, months = 12) =>
    api.get<ReputationHistoryEntry[]>(`/reputation/${userId}/reputation-history`, { params: { months } }),

  getMetadata: (userId: string) =>
    api.get<ReputationMetadata>(`/reputation/${userId}`),

  getWorkHistory: (userId: string) =>
    api.get<ReputationWorkHistoryEntry[]>(`/reputation/${userId}/history`),

  getLeaderboard: (params?: Record<string, string | number>) =>
    api.get<ReputationLeaderboardEntry[]>(
      '/reputation/leaderboard',
      { params }
    ),
};

export const reviewsApi = {
  submit: (data: {
    contractId: string;
    rating: number;
    comment: string;
    workQuality: number;
    communication: number;
    professionalism: number;
    wouldWorkAgain: boolean;
  }) => api.post<Review>('/reviews', data),

  getForUser: (userId: string) =>
    api.get<Review[]>(`/reviews/user/${userId}`),

  canReview: (contractId: string, rateeId: string) =>
    api.get<{ canRate: boolean; reason?: string }>(`/reviews/can-review/${contractId}`, { params: { rateeId } }),
};

export const matchingApi = {
  getProjectRecommendations: (limit?: number) =>
    api.get<ProjectRecommendation[]>('/matching/projects', { params: limit ? { limit } : undefined }),

  getFreelancerRecommendations: (projectId: string, limit?: number) =>
    api.get<FreelancerRecommendation[]>(`/matching/freelancers/${projectId}`, {
      params: limit ? { limit } : undefined,
    }),

  extractSkills: (text: string) =>
    api.post<ExtractedSkill[]>('/matching/extract-skills', { text }),

  getSkillGaps: (params?: { refresh?: boolean }) =>
    api.get<SkillGapAnalysis>('/matching/skill-gaps', { params }),

  generateProposal: (projectId: string, customNotes?: string) =>
    api.post<AIProposalResult>(`/matching/generate-proposal/${projectId}`, { customNotes }),
};

export const billingApi = {
  /** Current entitlement. Free is a valid state, not an error. */
  getSubscription: () => api.get<Subscription>('/billing/subscription'),

  /** Public plan descriptor, including live prices read from Stripe. */
  getPlans: () => api.get<BillingPlansResponse>('/billing/plans'),

  /**
   * Starts a Stripe-hosted Checkout. The returned URL must be validated with
   * isAllowedBillingRedirect before the browser is sent to it.
   */
  createCheckoutSession: (params?: { interval?: BillingInterval; successUrl?: string; cancelUrl?: string }) =>
    api.post<CheckoutSessionResponse>('/billing/checkout-session', params ?? {}),

  /** Stripe Customer Portal: cancel, resume, update card, invoice history. */
  createPortalSession: (params?: { returnUrl?: string }) =>
    api.post<BillingRedirect>('/billing/portal-session', params ?? {}),
};

export const kycApi = {
  initiate: () =>
    api.post<KycVerification>('/kyc/initiate'),

  getStatus: () =>
    api.get<KycVerification>('/kyc/status'),

  isVerified: () =>
    api.get<{ verified: boolean }>('/kyc/verified'),

  getHistory: () =>
    api.get<KycVerification[]>('/kyc/history'),

  refresh: (id: string) =>
    api.post<KycVerification>(`/kyc/refresh/${id}`),

  adminGetPending: () =>
    api.get<KycVerification[]>('/kyc/admin/pending'),

  adminGetByStatus: (status: string) =>
    api.get<KycVerification[]>(`/kyc/admin/status/${status}`),

  adminGetVerification: (id: string) =>
    api.get<KycVerification>(`/kyc/admin/verification/${id}`),

  adminGetDecision: (id: string) =>
    api.get<KycDecisionDetails>(`/kyc/admin/verification/${id}/decision`),

  adminReview: (id: string, decision: 'approved' | 'rejected', notes?: string) =>
    api.post<KycVerification>(`/kyc/admin/review/${id}`, { decision, notes }),
};

export const cryptoNewsApi = {
  getNews: (options?: { limit?: number; coin?: string; sort?: string; sources?: string }) =>
    api.get<CryptoNewsFeed>('/crypto-news/news', { params: options }),

  search: (query: string, limit?: number) =>
    api.get<{ results?: CryptoNewsArticle[]; articles?: CryptoNewsArticle[] }>('/crypto-news/search', {
      params: { q: query, limit },
    }),

  getSentiment: (options?: { limit?: number; asset?: string }) =>
    api.get<Record<string, unknown>>('/crypto-news/sentiment', { params: options }),

  getDigest: (options?: { period?: string; format?: string }) =>
    api.get<Record<string, unknown>>('/crypto-news/digest', { params: options }),

  getPrices: (coins?: string) =>
    api.get<CryptoPricesResponse>('/crypto-news/prices', {
      params: coins ? { coins } : undefined,
    }),

  getFearGreed: () =>
    api.get<FearGreedIndexData>('/crypto-news/fear-greed'),

  getGlobalMarketStats: () =>
    api.get<GlobalMarketStats>('/crypto-news/global'),

  getMovers: (direction: 'gainers' | 'losers' = 'gainers', options?: { limit?: number; timeframe?: string }) =>
    api.get<CryptoMarketMoversResponse>('/crypto-news/movers', {
      params: { direction, ...options },
    }),

  getCategories: (limit?: number) =>
    api.get<{ categories: Array<{ label: string; coin?: string; filter?: string }> }>('/crypto-news/categories', {
      params: limit ? { limit } : undefined,
    }),
};
