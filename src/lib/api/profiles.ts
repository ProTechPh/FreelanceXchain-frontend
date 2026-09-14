import type { AxiosResponse } from 'axios';
import api from '@/lib/api-client';
import { normalizeFreelancerProfile } from '@/lib/freelancer-profile-contract';
import type {
  FreelancerProfile,
  EmployerProfile,
  PortfolioItem,
  SearchResult,
  Attachment,
} from '@/types';

function normalizeFreelancerProfileResponse(
  response: AxiosResponse<FreelancerProfile>,
): AxiosResponse<FreelancerProfile> {
  return { ...response, data: normalizeFreelancerProfile(response.data) };
}

function normalizeFreelancerSearchResponse(
  response: AxiosResponse<SearchResult<FreelancerProfile>>,
): AxiosResponse<SearchResult<FreelancerProfile>> {
  return {
    ...response,
    data: {
      ...response.data,
      items: response.data.items.map(normalizeFreelancerProfile),
    },
  };
}

export const freelancersApi = {
  getProfile: () =>
    api.get<FreelancerProfile>('/freelancers/profile').then(normalizeFreelancerProfileResponse),

  createProfile: (data: Pick<FreelancerProfile, 'bio' | 'hourlyRate' | 'availability'>) =>
    api.post<FreelancerProfile>('/freelancers/profile', data).then(normalizeFreelancerProfileResponse),

  updateProfile: (data: Partial<Pick<FreelancerProfile, 'bio' | 'hourlyRate' | 'availability'>>) =>
    api.patch<FreelancerProfile>('/freelancers/profile', data).then(normalizeFreelancerProfileResponse),

  addSkills: (skills: FreelancerProfile['skills']) =>
    api.post<FreelancerProfile>('/freelancers/profile/skills', { skills }).then(normalizeFreelancerProfileResponse),

  removeSkill: (name: string) =>
    api.delete<FreelancerProfile>(`/freelancers/profile/skills/${encodeURIComponent(name)}`).then(normalizeFreelancerProfileResponse),

  addExperience: (experience: Omit<FreelancerProfile['experience'][number], 'id'>) =>
    api.post<FreelancerProfile>('/freelancers/profile/experience', experience).then(normalizeFreelancerProfileResponse),

  updateExperience: (id: string, experience: Partial<Omit<FreelancerProfile['experience'][number], 'id'>>) =>
    api.patch<FreelancerProfile>(`/freelancers/profile/experience/${encodeURIComponent(id)}`, experience).then(normalizeFreelancerProfileResponse),

  removeExperience: (id: string) =>
    api.delete<FreelancerProfile>(`/freelancers/profile/experience/${encodeURIComponent(id)}`).then(normalizeFreelancerProfileResponse),

  getPublicProfile: (id: string) =>
    api.get<FreelancerProfile>(`/freelancers/${id}`).then(normalizeFreelancerProfileResponse),
  
  search: (params?: Record<string, string | number>) =>
    api.get<SearchResult<FreelancerProfile>>(
      '/search/freelancers',
      { params }
    ).then(normalizeFreelancerSearchResponse),
};

export const employersApi = {
  getProfile: () =>
    api.get<EmployerProfile>('/employers/profile'),
  
  updateProfile: (data: Partial<Pick<EmployerProfile, 'companyName' | 'description' | 'industry'>>) =>
    api.patch<EmployerProfile>('/employers/profile', data),

  getPublicProfile: (id: string) =>
    api.get<EmployerProfile>(`/employers/${id}`),
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
