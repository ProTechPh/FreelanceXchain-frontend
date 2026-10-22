import type { AxiosResponse } from 'axios';
import api from '@/lib/api-client';
import { normalizeFreelancerProfile } from '@/lib/freelancer-profile-contract';
import type {
  BusinessDocument,
  BusinessDocumentType,
  BusinessProfileCompleteness,
  FreelancerProfile,
  EmployerProfile,
  SearchResult,
} from '@/types';

export type EmployerProfileUpdate = Partial<Pick<
  EmployerProfile,
  | 'companyName'
  | 'description'
  | 'industry'
  | 'tin'
  | 'registrationNumber'
  | 'businessAddress'
  | 'businessPhone'
  | 'businessEmail'
  | 'website'
>> & {
  businessType?: NonNullable<EmployerProfile['businessType']>;
  yearEstablished?: number;
};

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

  addSkills: (skills: Array<Pick<FreelancerProfile['skills'][number], 'name' | 'yearsOfExperience'>>) =>
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
  
  updateProfile: (data: EmployerProfileUpdate) =>
    api.patch<EmployerProfile>('/employers/profile', data),

  getPublicProfile: (id: string) =>
    api.get<EmployerProfile>(`/employers/${id}`),

  /** Create the employer profile if missing (lets a freelancer set up their employer side). */
  ensureProfile: () =>
    api.post<EmployerProfile>('/employers/profile'),

  submitForVerification: () =>
    api.post<{ verificationStatus: string; message: string }>('/employers/profile/submit-verification'),

  getCompleteness: () =>
    api.get<BusinessProfileCompleteness>('/employers/profile/completeness'),

  listDocuments: () =>
    api.get<{ documents: BusinessDocument[] }>('/employers/profile/documents'),

  uploadDocument: (file: File, documentType: BusinessDocumentType, label?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (label) formData.append('label', label);
    return api.post<BusinessDocument>('/employers/profile/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteDocument: (documentId: string) =>
    api.delete<{ id: string }>(`/employers/profile/documents/${documentId}`),

  getPublicDocuments: (id: string) =>
    api.get<{ documents: BusinessDocument[] }>(`/employers/${id}/documents`),
};
