'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { employersApi, freelancersApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import {
  validateEmployerProfile,
  validateFreelancerProfile,
  type EmployerProfileForm,
  type FreelancerProfileForm,
} from '@/lib/profile-form';
import { useAuthStore } from '@/stores/authStore';
import type { EmployerProfile, FreelancerProfile, UserRole } from '@/types';

type ProfileRole = Extract<UserRole, 'employer' | 'freelancer'>;

const emptyFreelancerForm: FreelancerProfileForm = {
  bio: '',
  hourlyRate: 1,
  availability: 'available',
};

const emptyEmployerForm: EmployerProfileForm = {
  companyName: '',
  description: '',
  industry: '',
};

export interface ProfileEditorState {
  freelancerProfile: FreelancerProfile | null;
  employerProfile: EmployerProfile | null;
  freelancerForm: FreelancerProfileForm;
  employerForm: EmployerProfileForm;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export interface UseProfileEditorResult extends ProfileEditorState {
  isDirty: boolean;
  updateFreelancerField: <K extends keyof FreelancerProfileForm>(
    field: K,
    value: FreelancerProfileForm[K]
  ) => void;
  updateEmployerField: <K extends keyof EmployerProfileForm>(
    field: K,
    value: EmployerProfileForm[K]
  ) => void;
  setFreelancerProfile: React.Dispatch<React.SetStateAction<FreelancerProfile | null>>;
  save: () => Promise<boolean>;
  reset: () => void;
  reload: () => Promise<void>;
}

export function useProfileEditor(role: ProfileRole): UseProfileEditorResult {
  const user = useAuthStore((state) => state.user);
  const [freelancerProfile, setFreelancerProfile] = useState<FreelancerProfile | null>(null);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [freelancerForm, setFreelancerForm] = useState<FreelancerProfileForm>(emptyFreelancerForm);
  const [employerForm, setEmployerForm] = useState<EmployerProfileForm>(emptyEmployerForm);
  const [savedFreelancerForm, setSavedFreelancerForm] = useState<FreelancerProfileForm>(emptyFreelancerForm);
  const [savedEmployerForm, setSavedEmployerForm] = useState<EmployerProfileForm>(emptyEmployerForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty =
    role === 'freelancer'
      ? JSON.stringify(freelancerForm) !== JSON.stringify(savedFreelancerForm)
      : JSON.stringify(employerForm) !== JSON.stringify(savedEmployerForm);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (role === 'freelancer') {
        const { data } = await freelancersApi.getProfile();
        setFreelancerProfile(data);
        const loaded = {
          bio: data.bio,
          hourlyRate: data.hourlyRate,
          availability: data.availability,
        };
        setFreelancerForm(loaded);
        setSavedFreelancerForm(loaded);
      } else {
        const { data } = await employersApi.getProfile();
        setEmployerProfile(data);
        const loaded = {
          companyName: data.companyName,
          description: data.description,
          industry: data.industry,
        };
        setEmployerForm(loaded);
        setSavedEmployerForm(loaded);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        if (role === 'freelancer') {
          setFreelancerProfile(null);
          setFreelancerForm(emptyFreelancerForm);
          setSavedFreelancerForm(emptyFreelancerForm);
        } else {
          const blank = {
            companyName: user?.name || '',
            description: '',
            industry: 'Technology',
          };
          setEmployerProfile(null);
          setEmployerForm(blank);
          setSavedEmployerForm(blank);
        }
      } else {
        setError(getApiErrorMessage(err, 'Unable to load your profile.'));
      }
    } finally {
      setLoading(false);
    }
  }, [role, user?.name]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const updateFreelancerField = useCallback(
    <K extends keyof FreelancerProfileForm>(field: K, value: FreelancerProfileForm[K]) => {
      setFreelancerForm((current) => ({ ...current, [field]: value }));
    },
    []
  );

  const updateEmployerField = useCallback(
    <K extends keyof EmployerProfileForm>(field: K, value: EmployerProfileForm[K]) => {
      setEmployerForm((current) => ({ ...current, [field]: value }));
    },
    []
  );

  const save = useCallback(async (): Promise<boolean> => {
    const validationError =
      role === 'freelancer'
        ? validateFreelancerProfile(freelancerForm)
        : validateEmployerProfile(employerForm);
    if (validationError) {
      toast.error(validationError);
      return false;
    }

    setSaving(true);
    try {
      if (role === 'freelancer') {
        const response = freelancerProfile
          ? await freelancersApi.updateProfile(freelancerForm)
          : await freelancersApi.createProfile(freelancerForm);
        setFreelancerProfile(response.data);
        setSavedFreelancerForm(freelancerForm);
      } else {
        const { data } = await employersApi.updateProfile(employerForm);
        setEmployerProfile(data);
        setSavedEmployerForm(employerForm);
      }
      toast.success('Profile saved.');
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to save your profile.'));
      return false;
    } finally {
      setSaving(false);
    }
  }, [employerForm, freelancerForm, freelancerProfile, role]);

  const reset = useCallback(() => {
    if (role === 'freelancer') {
      setFreelancerForm(savedFreelancerForm);
    } else {
      setEmployerForm(savedEmployerForm);
    }
  }, [role, savedEmployerForm, savedFreelancerForm]);

  return {
    freelancerProfile,
    employerProfile,
    freelancerForm,
    employerForm,
    loading,
    saving,
    error,
    isDirty,
    updateFreelancerField,
    updateEmployerField,
    setFreelancerProfile,
    save,
    reset,
    reload: loadProfile,
  };
}
