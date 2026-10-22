'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { getApiErrorMessage, normalizeAuthUser } from '@/lib/auth-contract';
import { BECOME_EMPLOYER_PATH, getRoleLabel, type ParticipantRole } from '@/lib/role-switch';
import { useAuthStore } from '@/stores/authStore';
import type { BusinessProfileCompleteness } from '@/types';
import { useRoleSwitchStore } from '@/stores/roleSwitchStore';

export interface SwitchRoleOptions {
  /** Stay on the current page instead of opening the new role's dashboard. */
  stay?: boolean;
  /** Open this page after switching instead of the new role's dashboard. */
  redirectTo?: string;
  /**
   * Called when switching to employer is refused because the business profile
   * is incomplete, instead of opening the setup page (e.g. when already on it).
   */
  onIncomplete?: (details: BusinessProfileGaps) => void;
}

export type BusinessProfileGaps = Pick<BusinessProfileCompleteness, 'missingFields' | 'missingDocuments'>;

/**
 * Switch the active role between freelancer and employer.
 *
 * Switching to employer needs a complete business profile; when it is not
 * complete the API answers 409 and the user is sent to the setup page.
 */
export function useRoleSwitch() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [switching, setSwitching] = useState<ParticipantRole | null>(null);

  const switchTo = useCallback(
    async (role: ParticipantRole, options: SwitchRoleOptions = {}): Promise<boolean> => {
      setSwitching(role);
      try {
        const { data } = await authApi.switchRole(role);
        if (!options.stay) {
          useRoleSwitchStore.getState().setPendingRole(role);
          router.push(options.redirectTo ?? `/dashboard/${role}`);
        }
        setUser(normalizeAuthUser(data.user));
        toast.success(`You're now acting as ${role === 'employer' ? 'an' : 'a'} ${getRoleLabel(role).toLowerCase()}.`);
        return true;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data?.error?.code === 'BUSINESS_PROFILE_INCOMPLETE') {
          toast.info('Complete your business information to start acting as an employer.');
          if (options.onIncomplete) {
            const details = error.response.data.error.details as Partial<BusinessProfileGaps> | undefined;
            options.onIncomplete({
              missingFields: details?.missingFields ?? [],
              missingDocuments: details?.missingDocuments ?? [],
            });
          } else {
            router.push(BECOME_EMPLOYER_PATH);
          }
          return false;
        }
        if (axios.isAxiosError(error) && error.response?.data?.error?.code === 'BUSINESS_PROFILE_NOT_VERIFIED') {
          const details = error.response.data.error.details as { verificationStatus?: string; verificationNotes?: string } | undefined;
          const status = details?.verificationStatus;
          if (status === 'rejected') {
            toast.error(error.response.data.error.message || 'Your business profile verification was rejected. Please review feedback and resubmit.');
          } else {
            toast.info(error.response.data.error.message || 'Your business profile is pending admin verification before you can switch to employer.');
          }
          router.push(BECOME_EMPLOYER_PATH);
          return false;
        }
        toast.error(getApiErrorMessage(error, 'Unable to switch roles right now. Please try again.'));
        return false;
      } finally {
        setSwitching(null);
      }
    },
    [router, setUser],
  );

  return { switchTo, switching };
}
