import type {
  AuthResult,
  RegisterInput,
  LoginInput,
  User,
  FreelancerProfile,
  FreelancerProfileUpdate,
  EmployerProfile,
  EmployerProfileUpdate,
  SkillCategory,
  Skill,
  Project,
  CreateProjectInput,
  AddMilestonesInput,
  Proposal,
  SubmitProposalInput,
  Contract,
  PaymentStatus,
  Dispute,
  CreateDisputeInput,
  SubmitEvidenceInput,
  ResolveDisputeInput,
  Notification,
  KycVerification,
  ProjectRecommendation,
  FreelancerRecommendation,
  ExtractedSkill,
  SkillGapAnalysis,
  SubmitRatingInput,
  UserReputation,
  PaginatedResponse,
  SearchPaginatedResponse,
  ApiError,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Toast notification helper (will be called from outside)
let showToastCallback: ((toast: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void) | null = null;

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing: boolean = false;

  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    
    // Fetch CSRF token if user is already authenticated
    if (this.accessToken) {
      this.fetchCsrfToken().catch(err => {
        console.error('Failed to fetch CSRF token on init:', err);
      });
    }
  }

  // Set toast callback from ToastContext
  setToastCallback(callback: (toast: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void) {
    showToastCallback = callback;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Add CSRF token from cookie for state-changing requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase() || 'GET')) {
      const csrfToken = this.getCsrfTokenFromCookie();
      if (csrfToken) {
        (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
      }
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Important: Include cookies in requests
    });

    // Handle token expiration
    if (response.status === 401) {
      // Prevent multiple simultaneous refresh attempts
      if (this.isRefreshing) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.request<T>(endpoint, options);
      }
      
      // Try to refresh token if we have one
      if (this.refreshToken && !this.isRefreshing) {
        this.isRefreshing = true;
        const refreshed = await this.refreshTokens();
        this.isRefreshing = false;
        
        if (refreshed) {
          // Retry the original request with new token
          return this.request<T>(endpoint, options);
        }
      }
      
      // Refresh failed or no refresh token - logout
      this.handleAuthFailure();
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const error = await response.json() as ApiError;
      throw new Error(this.sanitizeApiError(error.error.message, response.status));
    }

    return response.json();
  }

  /**
   * Extract CSRF token from cookie or localStorage fallback
   */
  private getCsrfTokenFromCookie(): string | null {
    // First try to get from cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === '__Host-psifi.x-csrf-token' || name === 'psifi.x-csrf-token') {
        return decodeURIComponent(value);
      }
    }
    
    // Fallback to localStorage if cookie is not available
    const tokenFromStorage = localStorage.getItem('csrf-token');
    if (tokenFromStorage) {
      console.log('[CSRF] Using token from localStorage (cookie not available)');
      return tokenFromStorage;
    }
    
    return null;
  }

  /**
   * Clear CSRF token cookie and localStorage (for logout)
   */
  private clearCsrfCookie(): void {
    // Clear both possible cookie names
    document.cookie = '__Host-psifi.x-csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'psifi.x-csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    // Also clear from localStorage
    localStorage.removeItem('csrf-token');
  }

  private sanitizeApiError(message: string, statusCode: number): string {
    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'production') {
      switch (statusCode) {
        case 400:
          return 'Invalid request. Please check your input and try again.';
        case 401:
          return 'Authentication required. Please login.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 409:
          return 'This action conflicts with existing data.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return 'An error occurred. Please try again.';
      }
    }
    
    // In development, show the actual error message
    return message;
  }

  private async refreshTokens(): Promise<boolean> {
    try {
      const result = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!result.ok) {
        console.log('Token refresh failed:', result.status);
        return false;
      }

      const data = await result.json() as AuthResult;
      this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  private handleAuthFailure(): void {
    // Show toast notification if callback is available
    if (showToastCallback) {
      showToastCallback({
        type: 'warning',
        title: 'Session Expired',
        message: 'Your session has expired. Please login again.',
      });
    }

    // Save current path for return after login
    const currentPath = window.location.pathname;
    const isAuthPage = ['/login', '/register', '/'].includes(currentPath);
    
    // Clear tokens and state
    this.clearAuth();
    
    // Redirect to login with return URL
    if (!isAuthPage && currentPath !== '/login') {
      window.location.href = `/login?returnUrl=${encodeURIComponent(currentPath)}`;
    } else {
      window.location.href = '/login';
    }
  }

  private clearAuth(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('auth-storage'); // Clear zustand persisted state
    this.clearCsrfCookie(); // Clear CSRF token cookie
  }

  setTokens(access: string, refresh: string): void {
    console.log('[AUTH] Setting tokens:', {
      hasAccess: !!access,
      hasRefresh: !!refresh,
      accessLength: access?.length || 0,
      refreshLength: refresh?.length || 0,
    });
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    console.log('[AUTH] Tokens set in localStorage and instance');
  }

  logout(): void {
    // Call backend logout endpoint to clear server-side session
    // Don't await - just fire and forget, then clear local state
    this.request('/auth/logout', { method: 'POST' })
      .catch(err => console.error('Logout request failed:', err));
    
    this.clearAuth();
    window.location.href = '/login';
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Fetch CSRF token from the server
   * This should be called when the app initializes or after login
   */
  async fetchCsrfToken(): Promise<void> {
    try {
      console.log('[CSRF] Fetching CSRF token from:', `${API_BASE}/auth/csrf-token`);
      const response = await fetch(`${API_BASE}/auth/csrf-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Include cookies
        body: JSON.stringify({}),
      });
      console.log('[CSRF] Response status:', response.status);
      console.log('[CSRF] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('[CSRF] Token response:', data);
        console.log('[CSRF] Cookies after fetch:', document.cookie);
        
        // If the response includes a token, store it in localStorage as fallback
        if (data.token) {
          console.log('[CSRF] Token received in response:', data.token);
          localStorage.setItem('csrf-token', data.token);
          console.log('[CSRF] Token stored in localStorage as fallback');
        }
      } else {
        console.error('[CSRF] Failed to fetch token:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('[CSRF] Error details:', errorData);
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      throw error; // Re-throw so calling code can handle it
    }
  }

  // =====================
  // Auth Endpoints
  // =====================
  async login(data: LoginInput): Promise<AuthResult> {
    const result = await this.request<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // When MFA is required, the accessToken is a temporary token — do NOT persist it
    if (!result.mfaRequired) {
      this.setTokens(result.accessToken, result.refreshToken);
      // Fetch CSRF token after successful login
      await this.fetchCsrfToken();
    }
    return result;
  }

  /** Called from MFA challenge page to complete a login that required MFA. */
  async completeMFALogin(tempAccessToken: string, factorId: string, code: string): Promise<AuthResult> {
    const result = await this.request<AuthResult>('/auth/login/mfa-verify', {
      method: 'POST',
      body: JSON.stringify({ accessToken: tempAccessToken, factorId, code }),
    });
    this.setTokens(result.accessToken, result.refreshToken);
    await this.fetchCsrfToken();
    return result;
  }

  async register(data: RegisterInput): Promise<AuthResult> {
    const result = await this.request<AuthResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setTokens(result.accessToken, result.refreshToken);
    // Fetch CSRF token after successful registration
    await this.fetchCsrfToken();
    return result;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  getOAuthUrl(provider: string): string {
    return `${API_BASE}/auth/oauth/${provider}`;
  }

  async registerOAuth(accessToken: string, role: 'freelancer' | 'employer', walletAddress?: string): Promise<AuthResult> {
    const result = await this.request<AuthResult>('/auth/oauth/register', {
      method: 'POST',
      body: JSON.stringify({ accessToken, role, walletAddress }),
    });
    this.setTokens(result.accessToken, result.refreshToken);
    return result;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async resendConfirmation(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/resend-confirmation', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // =====================
  // Freelancer Endpoints
  // =====================
  async getMyFreelancerProfile(): Promise<FreelancerProfile> {
    return this.request<FreelancerProfile>('/freelancers/profile');
  }

  async updateFreelancerProfile(data: FreelancerProfileUpdate): Promise<FreelancerProfile> {
    return this.request<FreelancerProfile>('/freelancers/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getFreelancer(id: string): Promise<FreelancerProfile> {
    return this.request<FreelancerProfile>(`/freelancers/${id}`);
  }

  async addSkill(skill: { name: string; yearsOfExperience: number }): Promise<FreelancerProfile> {
    return this.request<FreelancerProfile>('/freelancers/profile/skills', {
      method: 'POST',
      body: JSON.stringify({ skills: [skill] }),
    });
  }

  async removeSkill(skillName: string): Promise<FreelancerProfile> {
    return this.request<FreelancerProfile>(`/freelancers/profile/skills/${encodeURIComponent(skillName)}`, {
      method: 'DELETE',
    });
  }

  async addExperience(experience: Omit<import('../types').WorkExperience, 'id'>): Promise<FreelancerProfile> {
    return this.request<FreelancerProfile>('/freelancers/profile/experience', {
      method: 'POST',
      body: JSON.stringify(experience),
    });
  }

  async updateExperience(id: string, experience: Partial<import('../types').WorkExperience>): Promise<FreelancerProfile> {
    return this.request<FreelancerProfile>(`/freelancers/profile/experience/${id}`, {
      method: 'PUT',
      body: JSON.stringify(experience),
    });
  }

  async deleteExperience(id: string): Promise<void> {
    return this.request<void>(`/freelancers/profile/experience/${id}`, {
      method: 'DELETE',
    });
  }

  // =====================
  // Employer Endpoints
  // =====================
  async getMyEmployerProfile(): Promise<EmployerProfile> {
    return this.request<EmployerProfile>('/employers/profile');
  }

  async updateEmployerProfile(data: EmployerProfileUpdate): Promise<EmployerProfile> {
    return this.request<EmployerProfile>('/employers/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getEmployer(id: string): Promise<EmployerProfile> {
    return this.request<EmployerProfile>(`/employers/${id}`);
  }

  // =====================
  // Skills Endpoints
  // =====================
  async getSkillCategories(): Promise<SkillCategory[]> {
    const taxonomy = await this.request<{ categories: Array<SkillCategory & { skills: Skill[] }> }>('/skills');
    return taxonomy.categories.map(({ skills, ...category }) => category);
  }

  async getSkillCategory(id: string): Promise<SkillCategory> {
    return this.request<SkillCategory>(`/skills/categories/${id}`);
  }

  async getSkillsByCategory(categoryId: string): Promise<Skill[]> {
    return this.request<Skill[]>(`/skills/categories/${categoryId}/skills`);
  }

  async getAllSkills(): Promise<Skill[]> {
    const taxonomy = await this.request<{ categories: Array<SkillCategory & { skills: Skill[] }> }>('/skills');
    return taxonomy.categories.flatMap(category => category.skills);
  }

  async getSkill(id: string): Promise<Skill> {
    return this.request<Skill>(`/skills/${id}`);
  }

  async createSkillCategory(data: { name: string; description: string }): Promise<SkillCategory> {
    return this.request<SkillCategory>('/skills/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createSkill(data: { categoryId: string; name: string; description: string }): Promise<Skill> {
    return this.request<Skill>('/skills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // =====================
  // Project Endpoints
  // =====================
  async createProject(data: CreateProjectInput): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProjects(params?: Record<string, string | number>): Promise<PaginatedResponse<Project>> {
    const query = params
      ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}`
      : '';
    return this.request<PaginatedResponse<Project>>(`/projects${query}`);
  }

  async getMyProjects(params?: Record<string, string | number>): Promise<PaginatedResponse<Project>> {
    const query = params
      ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}`
      : '';
    return this.request<PaginatedResponse<Project>>(`/projects/my-projects${query}`);
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async updateProject(id: string, data: Partial<CreateProjectInput>): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async publishProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}/publish`, {
      method: 'POST',
    });
  }

  async addMilestones(projectId: string, data: AddMilestonesInput): Promise<Project> {
    return this.request<Project>(`/projects/${projectId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProjectProposals(projectId: string): Promise<Proposal[]> {
    const result = await this.request<PaginatedResponse<Proposal>>(`/projects/${projectId}/proposals`);
    return result.items;
  }

  async getMyEmployerProjects(): Promise<Project[]> {
    const result = await this.request<PaginatedResponse<Project>>('/employers/projects');
    return result.items;
  }

  // =====================
  // Proposal Endpoints
  // =====================
  async submitProposal(data: SubmitProposalInput): Promise<Proposal> {
    return this.request<Proposal>('/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProposal(id: string): Promise<Proposal> {
    return this.request<Proposal>(`/proposals/${id}`);
  }

  async getMyProposals(): Promise<Proposal[]> {
    return this.request<Proposal[]>('/proposals/freelancer/me');
  }

  async acceptProposal(id: string): Promise<{ proposal: Proposal; contract: Contract }> {
    return this.request<{ proposal: Proposal; contract: Contract }>(`/proposals/${id}/accept`, {
      method: 'POST',
    });
  }

  async rejectProposal(id: string): Promise<Proposal> {
    return this.request<Proposal>(`/proposals/${id}/reject`, {
      method: 'POST',
    });
  }

  async withdrawProposal(id: string): Promise<Proposal> {
    return this.request<Proposal>(`/proposals/${id}/withdraw`, {
      method: 'POST',
    });
  }

  // =====================
  // Contract Endpoints
  // =====================
  async getMyContracts(): Promise<Contract[]> {
    const result = await this.request<PaginatedResponse<Contract>>('/contracts');
    return result.items;
  }

  async getContract(id: string): Promise<Contract> {
    return this.request<Contract>(`/contracts/${id}`);
  }

  // =====================
  // Payment Endpoints
  // =====================
  async completeMilestone(milestoneId: string, contractId: string): Promise<{ milestoneId: string; status: string; notificationSent: boolean }> {
    return this.request<{ milestoneId: string; status: string; notificationSent: boolean }>(
      `/payments/milestones/${milestoneId}/complete?contractId=${contractId}`,
      { method: 'POST' }
    );
  }

  async approveMilestone(milestoneId: string, contractId: string): Promise<{ milestoneId: string; status: string; paymentReleased: boolean; transactionHash: string; contractCompleted: boolean }> {
    return this.request<{ milestoneId: string; status: string; paymentReleased: boolean; transactionHash: string; contractCompleted: boolean }>(
      `/payments/milestones/${milestoneId}/approve?contractId=${contractId}`,
      { method: 'POST' }
    );
  }

  async disputeMilestone(milestoneId: string, contractId: string): Promise<void> {
    return this.request<void>(
      `/payments/milestones/${milestoneId}/dispute?contractId=${contractId}`,
      { method: 'POST' }
    );
  }

  async getPaymentStatus(contractId: string): Promise<PaymentStatus> {
    return this.request<PaymentStatus>(`/payments/contracts/${contractId}/status`);
  }

  // =====================
  // Dispute Endpoints
  // =====================
  async createDispute(data: CreateDisputeInput): Promise<Dispute> {
    return this.request<Dispute>('/disputes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDispute(disputeId: string): Promise<Dispute> {
    return this.request<Dispute>(`/disputes/${disputeId}`);
  }

  async getDisputes(params?: { status?: string }): Promise<PaginatedResponse<Dispute>> {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return this.request<PaginatedResponse<Dispute>>(`/disputes${query}`);
  }

  async submitEvidence(disputeId: string, data: SubmitEvidenceInput): Promise<Dispute> {
    return this.request<Dispute>(`/disputes/${disputeId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resolveDispute(disputeId: string, data: ResolveDisputeInput): Promise<Dispute> {
    return this.request<Dispute>(`/disputes/${disputeId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getContractDisputes(contractId: string): Promise<Dispute[]> {
    return this.request<Dispute[]>(`/disputes/contracts/${contractId}/disputes`);
  }

  // =====================
  // Notification Endpoints
  // =====================
  async getNotifications(params?: { maxItemCount?: number; continuationToken?: string }): Promise<PaginatedResponse<Notification>> {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return this.request<PaginatedResponse<Notification>>(`/notifications${query}`);
  }

  async getUnreadCount(): Promise<{ count: number }> {
    return this.request<{ count: number }>('/notifications/unread-count');
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.request<Notification>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllAsRead(): Promise<void> {
    return this.request<void>('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  // =====================
  // KYC Endpoints (Didit Integration)
  // =====================
  
  /**
   * Initiate KYC verification with Didit
   * Returns session URL to redirect user to Didit verification flow
   */
  async initiateKycVerification(): Promise<{ id: string; didit_session_url: string; status: string }> {
    return this.request<{ id: string; didit_session_url: string; status: string }>('/kyc/initiate', {
      method: 'POST',
    });
  }

  async getKycStatus(): Promise<KycVerification | null> {
    return this.request<KycVerification | null>('/kyc/status');
  }

  async isKycVerified(): Promise<{ verified: boolean }> {
    return this.request<{ verified: boolean }>('/kyc/verified');
  }

  async getKycHistory(): Promise<KycVerification[]> {
    return this.request<KycVerification[]>('/kyc/history');
  }

  async refreshKycStatus(verificationId: string): Promise<KycVerification> {
    return this.request<KycVerification>(`/kyc/refresh/${verificationId}`, {
      method: 'POST',
    });
  }

  async getKycProfileData(): Promise<{ name: string; nationality: string; kyc_verified: boolean }> {
    return this.request<{ name: string; nationality: string; kyc_verified: boolean }>('/kyc/profile-data');
  }

  // Admin KYC endpoints
  async getPendingKycReviews(): Promise<KycVerification[]> {
    return this.request<KycVerification[]>('/kyc/admin/pending');
  }

  async getKycByStatus(status: string): Promise<KycVerification[]> {
    return this.request<KycVerification[]>(`/kyc/admin/status/${status}`);
  }

  async reviewKyc(verificationId: string, decision: 'approved' | 'rejected', notes?: string): Promise<KycVerification> {
    return this.request<KycVerification>(`/kyc/admin/review/${verificationId}`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes }),
    });
  }

  // =====================
  // Admin Stats Endpoints
  // =====================
  async getAdminStats(): Promise<{
    totalUsers: number;
    totalProjects: number;
    totalFreelancers: number;
    totalEmployers: number;
  }> {
    return this.request('/admin/stats');
  }

  async getAdminAnalytics(): Promise<{
    totalUsers: number;
    totalProjects: number;
    totalRevenue: number;
    activeContracts: number;
    userGrowth: number;
    projectGrowth: number;
  }> {
    return this.request('/admin/analytics');
  }

  async getAdminUsers(): Promise<Array<{
    id: string;
    email: string;
    role: 'freelancer' | 'employer' | 'admin';
    walletAddress: string;
    createdAt: string;
    name: string;
    kycVerified: boolean;
    isActive: boolean;
  }>> {
    return this.request('/admin/users');
  }

  async updateAdminUser(id: string, data: {
    role?: 'freelancer' | 'employer' | 'admin';
    name?: string;
    isActive?: boolean;
  }): Promise<{
    id: string;
    email: string;
    role: 'freelancer' | 'employer' | 'admin';
    walletAddress: string;
    createdAt: string;
    name: string;
    kycVerified: boolean;
    isActive: boolean;
  }> {
    return this.request(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getPlatformStats(): Promise<{
    totalFreelancers: number;
    totalEmployers: number;
    totalProjects: number;
    totalPaidOut: string;
    satisfactionRate: number;
  }> {
    return this.request('/admin/platform-stats');
  }

  // =====================
  // AI Matching Endpoints
  // =====================
  async getProjectRecommendations(): Promise<ProjectRecommendation[]> {
    return this.request<ProjectRecommendation[]>('/matching/projects');
  }

  async getFreelancerRecommendations(projectId: string): Promise<FreelancerRecommendation[]> {
    return this.request<FreelancerRecommendation[]>(`/matching/freelancers/${projectId}`);
  }

  async extractSkills(text: string): Promise<ExtractedSkill[]> {
    return this.request<ExtractedSkill[]>('/matching/extract-skills', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async getSkillGaps(): Promise<SkillGapAnalysis> {
    return this.request<SkillGapAnalysis>('/matching/skill-gaps');
  }

  // =====================
  // Search Endpoints
  // =====================
  async searchProjects(params?: Record<string, string | number>): Promise<SearchPaginatedResponse<Project>> {
    const query = params
      ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}`
      : '';
    return this.request<SearchPaginatedResponse<Project>>(`/search/projects${query}`);
  }

  async searchFreelancers(params?: Record<string, string | number>): Promise<SearchPaginatedResponse<FreelancerProfile>> {
    const query = params
      ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}`
      : '';
    return this.request<SearchPaginatedResponse<FreelancerProfile>>(`/search/freelancers${query}`);
  }

  // =====================
  // Reputation Endpoints
  // =====================
  async submitRating(data: SubmitRatingInput): Promise<{ rating: import('../types').Rating; transactionHash: string }> {
    return this.request<{ rating: import('../types').Rating; transactionHash: string }>('/reputation/rate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserReputation(userId: string): Promise<UserReputation> {
    return this.request<UserReputation>(`/reputation/${userId}`);
  }

  async getWorkHistory(userId: string): Promise<import('../types').WorkHistoryEntry[]> {
    return this.request<import('../types').WorkHistoryEntry[]>(`/reputation/${userId}/history`);
  }

  async canRate(contractId: string, rateeId: string): Promise<import('../types').CanRateResponse> {
    return this.request<import('../types').CanRateResponse>(`/reputation/can-rate?contractId=${contractId}&rateeId=${rateeId}`);
  }

  // File Upload Methods
  async uploadFile(
    file: File,
    bucket: 'profile-images' | 'contract-documents' | 'proposal-attachments' | 'dispute-evidence',
    folder?: string
  ): Promise<{ success: boolean; url: string; path: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    if (folder) {
      formData.append('folder', folder);
    }

    // Get CSRF token from cookie - required for security
    const csrfToken = this.getCsrfTokenFromCookie();
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.accessToken}`,
    };
    
    console.log('[UPLOAD] Auth token:', this.accessToken ? 'Present' : 'Missing');
    console.log('[UPLOAD] CSRF token:', csrfToken ? 'Present' : 'Missing');
    
    if (!csrfToken) {
      // Try to fetch CSRF token if missing
      console.log('[UPLOAD] CSRF token missing, attempting to fetch...');
      try {
        await this.fetchCsrfToken();
        const newCsrfToken = this.getCsrfTokenFromCookie();
        if (newCsrfToken) {
          (headers as Record<string, string>)['X-CSRF-Token'] = newCsrfToken;
          console.log('[UPLOAD] CSRF token fetched and added to headers');
        } else {
          throw new Error('Failed to obtain CSRF token');
        }
      } catch (error) {
        console.error('[UPLOAD] Failed to fetch CSRF token:', error);
        throw new Error('CSRF token required for file upload. Please refresh the page and try again.');
      }
    } else {
      (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload file');
    }

    return response.json();
  }

  async uploadMultipleFiles(
    files: File[],
    bucket: 'profile-images' | 'contract-documents' | 'proposal-attachments' | 'dispute-evidence',
    folder?: string
  ): Promise<{ success: boolean; files: Array<{ url: string; path: string; filename: string }> }> {
    const uploadPromises = files.map(file => this.uploadFile(file, bucket, folder));
    const results = await Promise.all(uploadPromises);
    
    return {
      success: true,
      files: results.map((result, index) => ({
        url: result.url,
        path: result.path,
        filename: files[index].name,
      })),
    };
  }

  async deleteFile(bucket: string, path: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/files/${bucket}/${path}`, {
      method: 'DELETE',
    });
  }

  async getSignedUrl(bucket: string, path: string, expiresIn?: number): Promise<{ success: boolean; url: string }> {
    const params = expiresIn ? `?expiresIn=${expiresIn}` : '';
    return this.request<{ success: boolean; url: string }>(`/files/signed-url/${bucket}/${path}${params}`);
  }

  async listUserFiles(bucket: string, folder?: string): Promise<{ success: boolean; files: any[] }> {
    const params = folder ? `?folder=${folder}` : '';
    return this.request<{ success: boolean; files: any[] }>(`/files/list/${bucket}${params}`);
  }

  // =====================
  // MFA Endpoints
  // =====================
  async enrollMFA(): Promise<{ qrCode: string; secret: string; factorId: string }> {
    return this.request<{ qrCode: string; secret: string; factorId: string }>('/auth/mfa/enroll', {
      method: 'POST',
    });
  }

  async verifyMFAEnrollment(factorId: string, code: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/mfa/verify-enrollment', {
      method: 'POST',
      body: JSON.stringify({ factorId, code }),
    });
  }

  async getMFAFactors(): Promise<{ factors: Array<{ id: string; type: string; status: string; created_at: string }> }> {
    return this.request<{ factors: Array<{ id: string; type: string; status: string; created_at: string }> }>('/auth/mfa/factors');
  }

  async challengeMFA(factorId: string): Promise<{ challengeId: string }> {
    return this.request<{ challengeId: string }>('/auth/mfa/challenge', {
      method: 'POST',
      body: JSON.stringify({ factorId }),
    });
  }

  async verifyMFAChallenge(factorId: string, challengeId: string, code: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ factorId, challengeId, code }),
    });
  }

  async disableMFA(factorId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/mfa/disable', {
      method: 'POST',
      body: JSON.stringify({ factorId }),
    });
  }

  async verifyMFALogin(accessToken: string, factorId: string, code: string): Promise<AuthResult> {
    return this.request<AuthResult>('/auth/login/mfa-verify', {
      method: 'POST',
      body: JSON.stringify({ accessToken, factorId, code }),
    });
  }

  // =====================
  // Audit Logs Endpoints
  // =====================
  async getMyAuditLogs(limit = 100): Promise<{ logs: Array<{
    id: string;
    action: string;
    resource_type: string;
    resource_id: string | null;
    payload: Record<string, any>;
    ip_address: string | null;
    user_agent: string | null;
    status: 'success' | 'failure' | 'pending';
    error_message: string | null;
    created_at: string;
  }> }> {
    return this.request<{ logs: Array<{
      id: string;
      action: string;
      resource_type: string;
      resource_id: string | null;
      payload: Record<string, any>;
      ip_address: string | null;
      user_agent: string | null;
      status: 'success' | 'failure' | 'pending';
      error_message: string | null;
      created_at: string;
    }> }>(`/audit-logs/me?limit=${limit}`);
  }
}

export const api = new ApiClient();
export default api;
