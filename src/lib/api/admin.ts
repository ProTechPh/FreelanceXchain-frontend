import api from '@/lib/api-client';
import type {
  PlatformStats,
  AdminUser,
  UserRole,
  AdminPermission,
  AdminAnalytics,
  DisputeManagementData,
  SystemHealth,
  AuditLogEntry,
  AuditLogSearchResponse,
  AdminActivitySummary,
  FreelancerAnalytics,
  EmployerAnalytics,
  SkillTrend,
  PlatformMetrics,
  MarketplaceLiquidityReport,
  FunnelMetricsReport,
  FileInfo,
  FileQuota,
} from '@/types';
import type { AuditSearchParams } from '@/lib/audit-log-search';
import { convertToSecureUrl } from '@/lib/api/files';

export const adminApi = {
  getStats: () =>
    api.get<PlatformStats>('/admin/stats'),

  getUsers: (params?: { status?: string; role?: string; kycStatus?: string; emailVerified?: boolean | string }) =>
    api.get<{ users: AdminUser[]; total: number }>('/admin/users', { params }),

  createUser: (data: {
    name: string;
    email: string;
    role: UserRole;
    password?: string;
    permissions?: AdminPermission[];
    autoVerifyEmail?: boolean;
    /** Start on Pro at no charge. Defaults to true server-side; admins are always Pro. */
    grantPro?: boolean;
    // `plan` in the response is the plan the new account actually starts on.
  }) => api.post<{ user: AdminUser; plan?: 'free' | 'pro'; temporaryPassword?: string }>('/admin/users', data),

  updateUser: (userId: string, data: { name?: string; role?: string; isActive?: boolean }) =>
    api.patch<AdminUser>(`/admin/users/${userId}`, data),

  updateUserPermissions: (userId: string, permissions: AdminPermission[]) =>
    api.patch<AdminUser>(`/admin/users/${userId}/permissions`, { permissions }),

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

  // Server-side filtered search with cursor pagination. Build `params` with
  // buildAuditSearchParams so empty filters are dropped rather than sent blank.
  search: (params: AuditSearchParams) =>
    api.get<AuditLogSearchResponse>('/audit-logs/search', { params }),

  getAdminActivitySummary: (startDate: string, endDate: string) =>
    api.get<AdminActivitySummary>('/audit-logs/summary/admin-activity', { params: { startDate, endDate } }),
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

  getLiquidityReport: () =>
    api.get<MarketplaceLiquidityReport>('/analytics/liquidity'),

  getFunnelMetrics: () =>
    api.get<FunnelMetricsReport>('/analytics/funnel'),
};

export const fileManagementApi = {
  list: (bucket?: string) => api.get<FileInfo[]>('/file-management', { params: bucket ? { bucket } : undefined }),

  getQuota: () => api.get<FileQuota>('/file-management/quota'),

  remove: (bucket: string, path: string) =>
    api.delete<{ message: string }>(`/file-management/${encodeURIComponent(bucket)}/${encodeURIComponent(path)}`),
};

export const fileUploadsApi = {
  upload: async (data: FormData) => {
    const response = await api.post<{ success: boolean; url: string; path: string }>('/files/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    // Convert the returned Appwrite URL to a secure proxy URL
    if (response.data && response.data.url) {
      response.data.url = convertToSecureUrl(response.data.url);
    }
    
    return response;
  },
  
  /**
   * Get a signed URL for a file.
   * Returns a secure proxy URL that verifies ownership.
   * 
   * @param bucket - The storage bucket name
   * @param fileId - The file ID or path
   * @returns Promise resolving to the signed URL response
   */
  getSignedUrl: (bucket: string, fileId: string) =>
    api.get<{ success: boolean; url: string }>(`/files/signed-url/${encodeURIComponent(bucket)}/${encodeURIComponent(fileId)}`),
  
  /**
   * Delete a file from storage.
   * Ownership is verified server-side before deletion.
   * 
   * @param bucket - The storage bucket name
   * @param fileId - The file ID or path
   * @returns Promise resolving to the deletion response
   */
  delete: (bucket: string, fileId: string) =>
    api.delete(`/files/${encodeURIComponent(bucket)}/${encodeURIComponent(fileId)}`),
    
  /**
   * List files in a bucket.
   * Only returns files owned by the authenticated user.
   * 
   * @param bucket - The storage bucket name
   * @returns Promise resolving to the list of files
   */
  list: (bucket: string) =>
    api.get<{ success: boolean; files: unknown[] }>(`/files/list/${encodeURIComponent(bucket)}`),
    
  /**
   * Get storage quota for the authenticated user.
   * 
   * @returns Promise resolving to quota information
   */
  getQuota: () =>
    api.get<{ success: boolean; used: number; limit: number; percentage: number; files: number }>('/files/quota'),
};