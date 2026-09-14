import api from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-token';
import type {
  AuthSuccessResponse,
  AuthResponse,
  AuthApiUser,
  OAuthCallbackResponse,
  LoginRequest,
  RegisterRequest,
  MfaVerifyRequest,
  MfaEnrollRequest,
  MfaEnrollResponse,
  MfaFactorsResponse,
  EmailPreferences,
  EmailPreferencesUpdate,
  UserRole,
} from '@/types';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),
  
  register: (data: RegisterRequest) =>
    api.post<AuthSuccessResponse>('/auth/register', data),
  
  logout: () =>
    api.post('/auth/logout'),
  
  getMe: () =>
    api.get<{ user: AuthApiUser }>('/auth/me'),
  
  refreshToken: (refreshToken?: string) => {
    const token = refreshToken || getAccessToken() || undefined;
    return api.post<AuthSuccessResponse>('/auth/refresh', token ? { refreshToken: token } : {});
  },
  
  forgotPassword: (email: string, turnstileToken?: string) =>
    api.post('/auth/forgot-password', { email, ...(turnstileToken && { 'cf-turnstile-response': turnstileToken }) }),
  
  resetPassword: (
    payloadOrToken: string | { userId?: string; secret?: string; accessToken?: string; password: string },
    password?: string
  ) => {
    if (typeof payloadOrToken === 'string') {
      return api.post<{ message: string }>('/auth/reset-password', { accessToken: payloadOrToken, password });
    }
    return api.post<{ message: string }>('/auth/reset-password', payloadOrToken);
  },

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword }),
  
  oauthLogin: (provider: 'google' | 'github') =>
    api.get<{ url: string }>(`/auth/oauth/${provider}`),

  oauthCallback: (data: { access_token?: string; accessToken?: string; userId?: string; secret?: string } | string) => {
    const payload = typeof data === 'string' ? { access_token: data } : data;
    return api.post<OAuthCallbackResponse>('/auth/oauth/callback', payload);
  },

  oauthRegister: (accessToken: string, role: Exclude<UserRole, 'admin'>) =>
    api.post<AuthSuccessResponse>('/auth/oauth/register', { accessToken, role }),

  resendConfirmation: (email: string) =>
    api.post<{ message: string }>('/auth/resend-confirmation', { email }),

  verifyEmail: (userId: string, secret: string) =>
    api.post<{ message: string }>('/auth/verify-email', { userId, secret }),

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

  disconnectWallet: () =>
    api.delete<{ message: string; walletAddress: string }>('/auth/wallet'),

  deleteAccount: () =>
    api.delete<{ message: string }>('/auth/account'),
};

export const emailPreferencesApi = {
  get: () => api.get<EmailPreferences>('/email-preferences'),

  update: (data: EmailPreferencesUpdate) =>
    api.patch<EmailPreferences>('/email-preferences', data),

  unsubscribeAll: () =>
    api.post<{ message: string }>('/email-preferences/unsubscribe-all'),
};

export interface UserPreferences {
  id: string;
  userId: string;
  tourProgress?: Partial<Record<'freelancer' | 'employer', {
    completedVersion?: number;
    autoStart?: boolean;
  }>>;
  createdAt: string;
  updatedAt: string;
}

export const userPreferencesApi = {
  get: () => api.get<UserPreferences>('/user-preferences'),

  updateTourProgress: (data: {
    role: 'freelancer' | 'employer';
    completedVersion?: number;
    autoStart?: boolean;
  }) => api.patch<UserPreferences>('/user-preferences/tour-progress', data),
};
