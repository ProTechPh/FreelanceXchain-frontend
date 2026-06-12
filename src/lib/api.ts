import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  FreelancerProfile,
  EmployerProfile,
  Project,
  Proposal,
  Contract,
  Message,
  Conversation,
  Notification,
  Transaction,
  ReputationScore,
  PlatformStats,
  Review,
  Dispute,
  ApiResponse,
  PaginatedResponse,
  MfaVerifyRequest,
  MfaEnrollRequest,
  MfaEnrollResponse,
  MfaFactorsResponse,
  KycVerification,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
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
    api.post<AuthResponse>('/auth/register', data),
  
  logout: () =>
    api.post('/auth/logout'),
  
  getMe: () =>
    api.get<ApiResponse<User>>('/auth/me'),
  
  refreshToken: (refresh_token: string) =>
    api.post<AuthResponse>('/auth/refresh', { refresh_token }),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  
  oauthLogin: (provider: 'google' | 'github') =>
    api.get<{ url: string }>(`/auth/oauth/${provider}`),
  
  mfaVerify: (data: MfaVerifyRequest) =>
    api.post<AuthResponse>('/auth/login/mfa-verify', data),
  
  mfaEnroll: (data: MfaEnrollRequest) =>
    api.post<MfaEnrollResponse>('/auth/mfa/enroll', data),
  
  mfaVerifyEnrollment: (factorType: string, code: string) =>
    api.post('/auth/mfa/verify', { factorType, code }),
  
  mfaFactors: () =>
    api.get<MfaFactorsResponse>('/auth/mfa/factors'),
  
  mfaDisable: (factorType: string) =>
    api.post('/auth/mfa/disable', { factorType }),
};

export const freelancersApi = {
  getProfile: () =>
    api.get<ApiResponse<FreelancerProfile>>('/freelancers/profile'),
  
  updateProfile: (data: Partial<FreelancerProfile>) =>
    api.patch<ApiResponse<FreelancerProfile>>('/freelancers/profile', data),
  
  getPublicProfile: (id: string) =>
    api.get<ApiResponse<FreelancerProfile>>(`/freelancers/${id}`),
  
  search: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<FreelancerProfile>>('/freelancers', { params }),
};

export const employersApi = {
  getProfile: () =>
    api.get<ApiResponse<EmployerProfile>>('/employers/profile'),
  
  updateProfile: (data: Partial<EmployerProfile>) =>
    api.patch<ApiResponse<EmployerProfile>>('/employers/profile', data),
};

export const projectsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Project>>('/projects', { params }),
  
  get: (id: string) =>
    api.get<ApiResponse<Project>>(`/projects/${id}`),
  
  create: (data: Partial<Project>) =>
    api.post<ApiResponse<Project>>('/projects', data),
  
  update: (id: string, data: Partial<Project>) =>
    api.patch<ApiResponse<Project>>(`/projects/${id}`, data),
  
  getMyProjects: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Project>>('/projects/my-projects', { params }),
  
  getProposals: (id: string) =>
    api.get<PaginatedResponse<Proposal>>(`/projects/${id}/proposals`),
};

export const proposalsApi = {
  submit: (data: Partial<Proposal>) =>
    api.post<ApiResponse<Proposal>>('/proposals', data),
  
  getMine: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Proposal>>('/proposals/freelancer/me', { params }),
  
  get: (id: string) =>
    api.get<ApiResponse<Proposal>>(`/proposals/${id}`),
  
  accept: (id: string) =>
    api.post<ApiResponse<Contract>>(`/proposals/${id}/accept`),
  
  reject: (id: string) =>
    api.post(`/proposals/${id}/reject`),
  
  withdraw: (id: string) =>
    api.post(`/proposals/${id}/withdraw`),
};

export const contractsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Contract>>('/contracts', { params }),
  
  get: (id: string) =>
    api.get<ApiResponse<Contract>>(`/contracts/${id}`),
  
  fund: (id: string) =>
    api.post<ApiResponse<Contract>>(`/contracts/${id}/fund`),
  
  cancel: (id: string) =>
    api.post(`/contracts/${id}/cancel`),
};

export const paymentsApi = {
  completeMilestone: (milestoneId: string) =>
    api.post(`/payments/milestones/${milestoneId}/complete`),
  
  approveMilestone: (milestoneId: string) =>
    api.post(`/payments/milestones/${milestoneId}/approve`),
  
  disputeMilestone: (milestoneId: string, reason: string) =>
    api.post(`/payments/milestones/${milestoneId}/dispute`, { reason }),
  
  getStatus: (contractId: string) =>
    api.get<ApiResponse<Contract>>(`/payments/contracts/${contractId}/status`),
};

export const messagesApi = {
  getConversations: () =>
    api.get<PaginatedResponse<Conversation>>('/messages/conversations'),
  
  getMessages: (conversationId: string, params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Message>>(`/messages/${conversationId}`, { params }),
  
  send: (conversationId: string, content: string) =>
    api.post<ApiResponse<Message>>(`/messages/${conversationId}`, { content }),
};

export const notificationsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { params }),
  
  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),
  
  markAllRead: () =>
    api.patch('/notifications/read-all'),
};

export const transactionsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Transaction>>('/transactions', { params }),
};

export const reputationApi = {
  getScore: (userId: string) =>
    api.get<ApiResponse<ReputationScore>>(`/reputation/${userId}/score`),
  
  getLeaderboard: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<ReputationScore>>('/reputation/leaderboard', { params }),
};

export const reviewsApi = {
  submit: (data: Partial<Review>) =>
    api.post<ApiResponse<Review>>('/reviews', data),
};

export const disputesApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Dispute>>('/disputes', { params }),
  
  create: (data: Partial<Dispute>) =>
    api.post<ApiResponse<Dispute>>('/disputes', data),
  
  get: (id: string) =>
    api.get<ApiResponse<Dispute>>(`/disputes/${id}`),
  
  submitEvidence: (id: string, data: FormData) =>
    api.post(`/disputes/${id}/evidence`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const matchingApi = {
  getProjectRecommendations: () =>
    api.get<PaginatedResponse<Project>>('/matching/projects'),
  
  getFreelancerRecommendations: (projectId: string) =>
    api.get<PaginatedResponse<FreelancerProfile>>(`/matching/freelancers/${projectId}`),
};

export const adminApi = {
  getStats: () =>
    api.get<ApiResponse<PlatformStats>>('/admin/stats'),
  
  getUsers: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<User>>('/admin/users', { params }),
  
  suspendUser: (id: string, reason: string) =>
    api.post(`/admin/users/${id}/suspend`, { reason }),
  
  unsuspendUser: (id: string) =>
    api.post(`/admin/users/${id}/unsuspend`),
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
