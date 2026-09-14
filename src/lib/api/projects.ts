import api from '@/lib/api-client';
import type {
  Project,
  ProjectCategoryStat,
  Proposal,
  ProposalWithEmployerHistory,
  Contract,
  PaginatedResponse,
  SearchResult,
  Favorite,
  SavedSearch,
  SkillTaxonomy,
  Skill,
  UserCustomSkill,
  SkillSuggestion,
} from '@/types';
import type {
  CreateProjectPayload,
  SetProjectMilestonesPayload,
} from '@/lib/project-submission';

export const projectsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Project>>('/projects', { params }),

  search: (params?: Record<string, string | number>) =>
    api.get<SearchResult<Project>>('/search/projects', { params }),

  getCategoryStats: () =>
    api.get<{ categories: ProjectCategoryStat[] }>('/projects/stats/categories'),
  
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
