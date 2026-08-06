import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  AuthSuccessResponse,
  AuthResponse,
  AuthApiUser,
  OAuthCallbackResponse,
  LoginRequest,
  RegisterRequest,
  FreelancerProfile,
  EmployerProfile,
  Project,
  Proposal,
  ProposalWithEmployerHistory,
  Contract,
  Milestone,
  Message,
  ConversationWithDetails,
  Notification,
  AuditLogEntry,
  Transaction,
  PlatformStats,
  Review,
  Dispute,
  DisputeEvidence,
  Attachment,
  PaginatedResponse,
  MfaVerifyRequest,
  MfaEnrollRequest,
  MfaEnrollResponse,
  MfaFactorsResponse,
  KycVerification,
  PortfolioItem,
  AdminUser,
  DisputeManagementData,
  SystemHealth,
  AdminAnalytics,
  FreelancerAnalytics,
  EmployerAnalytics,
  EmailPreferences,
  EmailPreferencesUpdate,
  SkillTrend,
  PlatformMetrics,
  SkillTaxonomy,
  Skill,
  UserRole,
  Favorite,
  SavedSearch,
  SearchResult,
  RushUpgradeRequest,
  RefundRequest,
  UserCustomSkill,
  SkillSuggestion,
  FileInfo,
  FileQuota,
  ContractFundInfo,
  ContractPaymentStatus,
  AggregatedReputationScore,
  ReputationBreakdown,
  ReputationHistoryEntry,
  ReputationMetadata,
  ReputationWorkHistoryEntry,
  ReputationLeaderboardEntry,
} from '@/types';
import type {
  CreateProjectPayload,
  SetProjectMilestonesPayload,
} from '@/lib/project-submission';
import {
  createCsrfTokenManager,
  isCsrfValidationFailure,
} from '@/lib/csrf-token';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Generate once before the first mutation instead of trusting a cookie left by an
// older API process. The response tells us which environment-specific cookie to
// echo, and a CSRF rejection triggers one forced refresh below.
const csrfTokenManager = createCsrfTokenManager({
  readCookies: () => (typeof document === 'undefined' ? '' : document.cookie),
  requestToken: async () => {
    // Use plain axios so the token request cannot recurse through this interceptor.
    const response = await axios.post<{ cookieName: string }>(
      `${API_URL}/auth/csrf-token`,
      undefined,
      { withCredentials: true },
    );
    return response.data;
  },
});

type CsrfRetryConfig = InternalAxiosRequestConfig & {
  csrfRetryAttempted?: boolean;
};

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    const method = (config.method ?? 'get').toUpperCase();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const csrfToken = await csrfTokenManager.ensureToken();
      config.headers['x-csrf-token'] = csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const requestConfig = error.config as CsrfRetryConfig | undefined;
    if (
      isCsrfValidationFailure(error)
      && requestConfig
      && !requestConfig.csrfRetryAttempted
    ) {
      requestConfig.csrfRetryAttempted = true;
      const csrfToken = await csrfTokenManager.ensureToken({ forceRefresh: true });
      requestConfig.headers['x-csrf-token'] = csrfToken;
      return api.request(requestConfig);
    }

    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),
  
  register: (data: RegisterRequest) =>
    api.post<AuthSuccessResponse>('/auth/register', data),
  
  logout: () =>
    api.post('/auth/logout'),
  
  getMe: () =>
    api.get<{ user: AuthApiUser }>('/auth/me'),
  
  refreshToken: (refreshToken: string) =>
    api.post<AuthSuccessResponse>('/auth/refresh', { refreshToken }),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (accessToken: string, password: string) =>
    api.post<{ message: string }>('/auth/reset-password', { accessToken, password }),
  
  oauthLogin: (provider: 'google' | 'github') =>
    api.get<{ url: string }>(`/auth/oauth/${provider}`),

  oauthCallback: (accessToken: string) =>
    api.post<OAuthCallbackResponse>('/auth/oauth/callback', { access_token: accessToken }),

  oauthRegister: (accessToken: string, role: Exclude<UserRole, 'admin'>) =>
    api.post<AuthSuccessResponse>('/auth/oauth/register', { accessToken, role }),

  resendConfirmation: (email: string) =>
    api.post<{ message: string }>('/auth/resend-confirmation', { email }),

  requestEmailOtp: (email: string) =>
    api.post<{ userId: string }>('/auth/login/email-otp', { email }),

  requestMagicUrl: (email: string) =>
    api.post<{ userId: string }>('/auth/login/magic-url', { email }),

  verifyPasswordlessToken: (userId: string, secret: string) =>
    api.post<OAuthCallbackResponse>('/auth/login/verify-token', { userId, secret }),
  
  mfaVerify: (data: MfaVerifyRequest) =>
    api.post<AuthSuccessResponse>('/auth/login/mfa-verify', data),
  
  mfaEnroll: (data: MfaEnrollRequest) =>
    api.post<MfaEnrollResponse>('/auth/mfa/enroll', data),
  
  mfaVerifyEnrollment: (factorType: string, code: string) =>
    api.post<{ message: string }>('/auth/mfa/verify-enrollment', { factorId: factorType, code }),
  
  mfaFactors: () =>
    api.get<MfaFactorsResponse>('/auth/mfa/factors'),
  
  mfaDisable: (factorId: string, otpCode: string) =>
    api.post<{ message: string }>('/auth/mfa/disable', { factorId, otpCode }),

  updateWallet: (walletAddress: string) =>
    api.patch<{ walletAddress: string }>('/auth/wallet', { walletAddress }),
};

export const emailPreferencesApi = {
  get: () => api.get<EmailPreferences>('/email-preferences'),

  update: (data: EmailPreferencesUpdate) =>
    api.patch<EmailPreferences>('/email-preferences', data),

  unsubscribeAll: () =>
    api.post<{ message: string }>('/email-preferences/unsubscribe-all'),
};

export const freelancersApi = {
  getProfile: () =>
    api.get<FreelancerProfile>('/freelancers/profile'),

  createProfile: (data: Pick<FreelancerProfile, 'bio' | 'hourlyRate' | 'availability'>) =>
    api.post<FreelancerProfile>('/freelancers/profile', data),

  updateProfile: (data: Partial<Pick<FreelancerProfile, 'bio' | 'hourlyRate' | 'availability'>>) =>
    api.patch<FreelancerProfile>('/freelancers/profile', data),

  addSkills: (skills: FreelancerProfile['skills']) =>
    api.post<FreelancerProfile>('/freelancers/profile/skills', { skills }),

  removeSkill: (name: string) =>
    api.delete<FreelancerProfile>(`/freelancers/profile/skills/${encodeURIComponent(name)}`),

  addExperience: (experience: Omit<FreelancerProfile['experience'][number], 'id'>) =>
    api.post<FreelancerProfile>('/freelancers/profile/experience', experience),

  updateExperience: (id: string, experience: Partial<Omit<FreelancerProfile['experience'][number], 'id'>>) =>
    api.patch<FreelancerProfile>(`/freelancers/profile/experience/${id}`, experience),

  removeExperience: (id: string) =>
    api.delete<FreelancerProfile>(`/freelancers/profile/experience/${id}`),

  getPublicProfile: (id: string) =>
    api.get<FreelancerProfile>(`/freelancers/${id}`),
  
  search: (params?: Record<string, string | number>) =>
    api.get<SearchResult<FreelancerProfile>>(
      '/search/freelancers',
      { params }
    ),
};

export const employersApi = {
  getProfile: () =>
    api.get<EmployerProfile>('/employers/profile'),
  
  updateProfile: (data: Partial<Pick<EmployerProfile, 'companyName' | 'description' | 'industry'>>) =>
    api.patch<EmployerProfile>('/employers/profile', data),

  getPublicProfile: (id: string) =>
    api.get<EmployerProfile>(`/employers/${id}`),
};

export const projectsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Project>>('/projects', { params }),

  search: (params?: Record<string, string | number>) =>
    api.get<SearchResult<Project>>('/search/projects', { params }),
  
  get: (id: string) =>
    api.get<Project>(`/projects/${id}`),
  
  create: (data: CreateProjectPayload) =>
    api.post<Project>('/projects', data),

  createWithAttachments: (data: FormData) =>
    api.post<Project>('/projects/with-attachments', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  setMilestones: (id: string, data: SetProjectMilestonesPayload) =>
    api.post<Project>(`/projects/${id}/milestones`, data),
  
  update: (id: string, data: Partial<Project>) =>
    api.patch<Project>(`/projects/${id}`, data),
  
  getMyProjects: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Project>>('/projects/my-projects', { params }),
  
  getProposals: (id: string) =>
    api.get<PaginatedResponse<Proposal>>(`/projects/${id}/proposals`),
};

export const favoritesApi = {
  list: <T = unknown>(targetType?: 'project' | 'freelancer') =>
    api.get<Favorite<T>[]>('/favorites', { params: targetType ? { targetType } : undefined }),

  add: (targetType: 'project' | 'freelancer', targetId: string) =>
    api.post<Favorite>('/favorites', { targetType, targetId }),

  remove: (targetType: 'project' | 'freelancer', targetId: string) =>
    api.delete<{ message: string }>(`/favorites/${targetType}/${targetId}`),

  check: (targetType: 'project' | 'freelancer', targetId: string) =>
    api.get<{ isFavorited: boolean }>(`/favorites/check/${targetType}/${targetId}`),
};

export const savedSearchesApi = {
  list: (searchType?: 'project' | 'freelancer') =>
    api.get<SavedSearch[]>('/saved-searches', { params: searchType ? { searchType } : undefined }),

  create: (data: Pick<SavedSearch, 'name' | 'searchType' | 'filters' | 'notifyOnNew'>) =>
    api.post<SavedSearch>('/saved-searches', data),

  update: (id: string, data: Partial<Pick<SavedSearch, 'name' | 'filters' | 'notifyOnNew'>>) =>
    api.patch<SavedSearch>(`/saved-searches/${id}`, data),

  remove: (id: string) =>
    api.delete<{ message: string }>(`/saved-searches/${id}`),

  execute: (id: string) =>
    api.post<{ results: unknown[]; count: number }>(`/saved-searches/${id}/execute`),
};

export const skillsApi = {
  getTaxonomy: () => api.get<SkillTaxonomy>('/skills'),

  createCategory: (name: string, description: string) =>
    api.post<SkillTaxonomy['categories'][number]>('/skills/categories', { name, description }),

  createSkill: (categoryId: string, name: string, description: string) =>
    api.post<Skill>('/skills', { categoryId, name, description }),

  deprecate: (id: string) =>
    api.patch<Skill>(`/skills/${id}/deprecate`),

  listCustom: () => api.get<UserCustomSkill[]>('/skills/custom'),

  createCustom: (data: { name: string; description: string; yearsOfExperience: number; categoryName?: string; suggestForGlobal?: boolean }) =>
    api.post<UserCustomSkill>('/skills/custom', data),

  updateCustom: (id: string, data: { name?: string; description?: string; yearsOfExperience?: number; categoryName?: string }) =>
    api.put<UserCustomSkill>(`/skills/custom/${id}`, data),

  deleteCustom: (id: string) => api.delete(`/skills/custom/${id}`),

  listSuggestions: () => api.get<SkillSuggestion[]>('/skills/suggestions'),

  moderateSuggestion: (id: string, status: 'approved' | 'rejected') =>
    api.put<SkillSuggestion>(`/skills/suggestions/${id}/status`, { status }),
};

export const proposalsApi = {
  submit: (data: Partial<Proposal>) =>
    api.post<Proposal>('/proposals', data),

  submitWithFiles: (data: FormData) =>
    api.post<Proposal>('/proposals', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getMine: () =>
    api.get<Proposal[]>('/proposals/freelancer/me'),

  get: (id: string) =>
    api.get<Proposal>(`/proposals/${id}`),

  getWithEmployerHistory: (id: string) =>
    api.get<ProposalWithEmployerHistory>(`/proposals/${id}/with-employer-history`),

  accept: (id: string) =>
    api.post<{ proposal: Proposal; contract: Contract }>(`/proposals/${id}/accept`),

  reject: (id: string) =>
    api.post<Proposal>(`/proposals/${id}/reject`),

  withdraw: (id: string) =>
    api.post<Proposal>(`/proposals/${id}/withdraw`),
};

export const contractsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Contract>>('/contracts', { params }),
  
  get: (id: string) =>
    api.get<Contract>(`/contracts/${id}`),

  fund: (id: string) =>
    api.post<{ message: string; escrowAddress: string; contractStatus: Contract['status'] }>(`/contracts/${id}/fund`),

  getFundInfo: (id: string) =>
    api.get<ContractFundInfo>(`/contracts/${id}/fund-info`),
  
  cancel: (id: string) =>
    api.post<{ message: string }>(`/contracts/${id}/cancel`),

  getDisputes: (id: string) =>
    api.get<Dispute[]>(`/contracts/${id}/disputes`),
};

export const rushUpgradesApi = {
  list: (contractId: string) =>
    api.get<RushUpgradeRequest[]>(`/contracts/${contractId}/rush-upgrade-requests`),

  request: (contractId: string, proposedPercentage: number) =>
    api.post<RushUpgradeRequest>(`/contracts/${contractId}/rush-upgrade`, { proposedPercentage }),

  respond: (requestId: string, action: 'accept' | 'decline' | 'counter_offer', counterPercentage?: number) =>
    api.post<RushUpgradeRequest | { request: RushUpgradeRequest; contract: Contract }>(
      `/rush-upgrade-requests/${requestId}/respond`,
      { action, ...(counterPercentage === undefined ? {} : { counterPercentage }) },
    ),

  acceptCounter: (requestId: string) =>
    api.post<{ request: RushUpgradeRequest; contract: Contract }>(`/rush-upgrade-requests/${requestId}/accept-counter`),

  declineCounter: (requestId: string) =>
    api.post<RushUpgradeRequest>(`/rush-upgrade-requests/${requestId}/decline-counter`),
};

export const refundsApi = {
  list: (contractId: string) =>
    api.get<RefundRequest[]>(`/escrow/${contractId}/refunds`),

  request: (contractId: string, data: { reason: string; amount?: number }) =>
    api.post<RefundRequest>(`/escrow/${contractId}/refund-request`, data),

  approve: (refundId: string) =>
    api.post<RefundRequest>(`/escrow/refunds/${refundId}/approve`),

  reject: (refundId: string, reason: string) =>
    api.post<RefundRequest>(`/escrow/refunds/${refundId}/reject`, { reason }),
};

export const milestonesApi = {
  listForContract: (contractId: string) =>
    api.get<Milestone[]>(`/milestones/contract/${contractId}`),

  submitWithFiles: (milestoneId: string, data: FormData) =>
    api.post<Milestone>(`/milestones/${milestoneId}/submit-with-files`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  approve: (milestoneId: string, feedback?: string) =>
    api.post<Milestone>(`/milestones/${milestoneId}/approve`, { feedback }),

  reject: (milestoneId: string, reason: string, requestRevision = true) =>
    api.post<Milestone>(`/milestones/${milestoneId}/reject`, { reason, requestRevision }),
};

export const paymentsApi = {
  completeMilestone: (contractId: string, milestoneId: string) =>
    api.post(`/payments/milestones/${milestoneId}/complete`, undefined, { params: { contractId } }),
  
  approveMilestone: (contractId: string, milestoneId: string) =>
    api.post(`/payments/milestones/${milestoneId}/approve`, undefined, { params: { contractId } }),
  
  disputeMilestone: (contractId: string, milestoneId: string, reason: string) =>
    api.post(`/payments/milestones/${milestoneId}/dispute`, { reason }, { params: { contractId } }),
  
  getStatus: (contractId: string) =>
    api.get<ContractPaymentStatus>(`/payments/contracts/${contractId}/status`),
};

export const messagesApi = {
  getConversations: () =>
    api.get<{ items: ConversationWithDetails[]; total: number; hasMore: boolean }>(
      '/messages/conversations'
    ),

  getConversationMessages: (conversationId: string, params?: { page?: number; limit?: number }) =>
    api.get<{ items: Message[]; total: number; hasMore: boolean }>(
      `/messages/conversations/${conversationId}`,
      { params }
    ),

  send: (receiverId: string, content: string, attachments?: Attachment[]) =>
    api.post<Message>('/messages/send', { receiverId, content, attachments }),

  markConversationRead: (conversationId: string) =>
    api.patch<{ message: string }>(`/messages/conversations/${conversationId}/read`),

  getUnreadCount: () =>
    api.get<{ count: number }>('/messages/unread-count'),
};

export const notificationsApi = {
  list: (params?: { maxItemCount?: number; continuationToken?: string }) =>
    api.get<{ items: Notification[]; continuationToken?: string; hasMore: boolean }>(
      '/notifications',
      { params }
    ),

  markRead: (id: string) =>
    api.patch<Notification>(`/notifications/${id}/read`),

  markAllRead: () =>
    api.patch<{ count: number }>('/notifications/read-all'),

  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count'),
};

export const transactionsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Transaction>>('/transactions', { params }),

  get: (id: string) =>
    api.get<Transaction>(`/transactions/${id}`),

  getForContract: (contractId: string) =>
    api.get<Transaction[]>(`/transactions/contract/${contractId}`),
};

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

export const disputesApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<{ items: Dispute[]; continuationToken?: string | null }>('/disputes', { params }),

  create: (data: Pick<Dispute, 'contractId' | 'milestoneId' | 'reason'>) =>
    api.post<Dispute>('/disputes', data),

  get: (id: string) =>
    api.get<Dispute>(`/disputes/${id}`),

  submitEvidenceFiles: (id: string, data: FormData) =>
    api.post<Dispute>(`/disputes/${id}/evidence`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  submitEvidence: (id: string, type: 'text' | 'link', content: string) =>
    api.post<Dispute>(`/disputes/${id}/evidence`, { type, content }),

  listEvidence: (id: string) =>
    api.get<DisputeEvidence[]>(`/disputes/${id}/evidence`),

  deleteEvidence: (disputeId: string, evidenceId: string) =>
    api.delete<{ message: string }>(`/disputes/${disputeId}/evidence/${evidenceId}`),

  verifyEvidence: (disputeId: string, evidenceId: string) =>
    api.post<DisputeEvidence>(`/disputes/${disputeId}/evidence/${evidenceId}/verify`),

  resolve: (disputeId: string, decision: 'freelancer_favor' | 'employer_favor', reasoning: string) =>
    api.post<Dispute>(`/disputes/${disputeId}/resolve`, { decision, reasoning }),
};

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

export const matchingApi = {
  getProjectRecommendations: (limit?: number) =>
    api.get<ProjectRecommendation[]>('/matching/projects', { params: limit ? { limit } : undefined }),

  getFreelancerRecommendations: (projectId: string, limit?: number) =>
    api.get<FreelancerRecommendation[]>(`/matching/freelancers/${projectId}`, {
      params: limit ? { limit } : undefined,
    }),

  extractSkills: (text: string) =>
    api.post<ExtractedSkill[]>('/matching/extract-skills', { text }),

  getSkillGaps: () =>
    api.get<SkillGapAnalysis>('/matching/skill-gaps'),
};

export const emailApi = {
  list: (params?: { folder?: string; limit?: number; offset?: number; isRead?: boolean }) =>
    api.get('/inbox', { params }),

  getUnreadCount: (folder?: string) =>
    api.get<{ count: number }>('/inbox/unread-count', { params: { folder } }),

  getById: (id: string) =>
    api.get(`/inbox/${id}`),

  update: (id: string, data: { is_read?: boolean; is_starred?: boolean; folder?: string }) =>
    api.patch(`/inbox/${id}`, data),

  delete: (id: string) =>
    api.delete(`/inbox/${id}`),

  send: (data: { to: string; subject: string; text: string; html?: string }) =>
    api.post('/inbox/send', data),

  reply: (id: string, data: { text: string; html?: string }) =>
    api.post(`/inbox/${id}/reply`, data),
};

export const adminApi = {
  getStats: () =>
    api.get<PlatformStats>('/admin/stats'),

  getUsers: (params?: { status?: string; role?: string }) =>
    api.get<{ users: AdminUser[]; total: number }>('/admin/users', { params }),

  updateUser: (userId: string, data: { name?: string; role?: string; isActive?: boolean }) =>
    api.patch<AdminUser>(`/admin/users/${userId}`, data),

  suspendUser: (id: string, reason: string) =>
    api.post(`/admin/users/${id}/suspend`, { reason }),

  unsuspendUser: (id: string) =>
    api.post(`/admin/users/${id}/unsuspend`),

  verifyUser: (id: string, reason: string) =>
    api.post(`/admin/users/${id}/verify`, { reason }),

  getAnalytics: () =>
    api.get<AdminAnalytics>('/admin/analytics'),

  getDisputeManagement: (status?: string) =>
    api.get<DisputeManagementData>('/admin/disputes', { params: status ? { status } : undefined }),

  getSystemHealth: () =>
    api.get<SystemHealth>('/admin/system/health'),
};

export const portfolioApi = {
  create: (data: FormData) =>
    api.post<PortfolioItem>('/portfolio', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getByFreelancer: (freelancerId: string) =>
    api.get<PortfolioItem[]>(`/portfolio/freelancer/${freelancerId}`),

  get: (id: string) =>
    api.get<PortfolioItem>(`/portfolio/${id}`),

  update: (id: string, data: Partial<{ title: string; description: string; projectUrl: string; images: Attachment[]; skills: string[]; completedAt: string }>) =>
    api.patch<PortfolioItem>(`/portfolio/${id}`, data),

  delete: (id: string) =>
    api.delete(`/portfolio/${id}`),
};

export const fileManagementApi = {
  list: (bucket?: string) => api.get<FileInfo[]>('/file-management', { params: bucket ? { bucket } : undefined }),

  getQuota: () => api.get<FileQuota>('/file-management/quota'),

  remove: (bucket: string, path: string) =>
    api.delete<{ message: string }>(`/file-management/${encodeURIComponent(bucket)}/${encodeURIComponent(path)}`),
};

export const auditLogsApi = {
  getMine: (limit?: number) =>
    api.get<{ logs: AuditLogEntry[] }>('/audit-logs/me', { params: limit ? { limit } : undefined }),

  getByUser: (userId: string, limit?: number) =>
    api.get<{ logs: AuditLogEntry[] }>(`/audit-logs/user/${userId}`, { params: limit ? { limit } : undefined }),

  getByResource: (resourceType: string, resourceId: string) =>
    api.get<{ logs: AuditLogEntry[] }>(`/audit-logs/resource/${resourceType}/${resourceId}`),

  getByAction: (action: string, limit?: number) =>
    api.get<{ logs: AuditLogEntry[] }>(`/audit-logs/action/${action}`, { params: limit ? { limit } : undefined }),

  getFailed: (limit?: number) =>
    api.get<{ logs: AuditLogEntry[] }>('/audit-logs/failed', { params: limit ? { limit } : undefined }),

  getByDateRange: (startDate: string, endDate: string) =>
    api.get<{ logs: AuditLogEntry[] }>('/audit-logs/range', { params: { startDate, endDate } }),

  getSystemReport: (startDate: string, endDate: string) =>
    api.get('/audit-logs/report/system', { params: { startDate, endDate } }),

  getUserReport: (userId: string, startDate: string, endDate: string) =>
    api.get(`/audit-logs/report/user/${userId}`, { params: { startDate, endDate } }),

  getById: (id: string) =>
    api.get<AuditLogEntry>(`/audit-logs/${id}`),
};

export const analyticsApi = {
  getFreelancer: (params?: { startDate?: string; endDate?: string }) =>
    api.get<FreelancerAnalytics>('/analytics/freelancer', { params }),

  getEmployer: (params?: { startDate?: string; endDate?: string }) =>
    api.get<EmployerAnalytics>('/analytics/employer', { params }),

  getSkillTrends: () =>
    api.get<SkillTrend[]>('/analytics/skill-trends'),

  getPlatform: () =>
    api.get<PlatformMetrics>('/analytics/platform'),
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

  adminReview: (id: string, decision: 'approved' | 'rejected', notes?: string) =>
    api.post<KycVerification>(`/kyc/admin/review/${id}`, { decision, notes }),
};

export default api;
