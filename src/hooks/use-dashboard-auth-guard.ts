'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  getKycReminderStorageKey,
  shouldOfferKycReminder,
} from '@/lib/first-login-kyc';
import { isDashboardHome, isTourRole } from '@/lib/onboarding-tour';
import type { UserRole } from '@/types';

export interface UseDashboardAuthGuardOptions {
  allowedRoles?: UserRole[];
}

export function useDashboardAuthGuard({ allowedRoles }: UseDashboardAuthGuardOptions = {}) {
  const { user, isAuthenticated, isLoading, loadUser, hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [kycReminder, setKycReminder] = useState<{
    contextKey: string | null;
    status: 'hidden' | 'open' | 'navigating';
  }>({ contextKey: null, status: 'hidden' });

  const isWrongRole = !!(allowedRoles && user && !allowedRoles.includes(user.role));
  const isEmailUnverified = !!(user && user.role !== 'admin' && user.emailVerification === false);
  const reminderContextKey = `${user?.id ?? ''}:${user?.role ?? ''}:${user?.kycStatus ?? ''}:${pathname ?? ''}`;
  const isParticipantHome = isDashboardHome(pathname, user?.role);
  const isReminderResolved = kycReminder.contextKey === reminderContextKey;
  const isKycExperienceBlocking =
    isParticipantHome &&
    (!isReminderResolved || kycReminder.status === 'open' || kycReminder.status === 'navigating');

  useEffect(() => {
    if (hasHydrated) {
      loadUser();
    }
  }, [hasHydrated, loadUser]);

  useEffect(() => {
    if (hasHydrated && !isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [hasHydrated, isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (hasHydrated && !isLoading && isAuthenticated && isWrongRole && user) {
      router.push(`/dashboard/${user.role}`);
    }
  }, [hasHydrated, isLoading, isAuthenticated, isWrongRole, user, router]);

  const isRedirecting =
    (hasHydrated && !isLoading && !isAuthenticated) ||
    (hasHydrated && !isLoading && isAuthenticated && isWrongRole);

  useEffect(() => {
    let cancelled = false;
    const seenThisSession = user?.id
      ? sessionStorage.getItem(getKycReminderStorageKey(user.id)) === 'true'
      : false;
    const shouldOpen = shouldOfferKycReminder({
      authHasHydrated: hasHydrated,
      isAuthenticated,
      userId: user?.id,
      role: user?.role,
      emailVerification: user?.emailVerification,
      kycStatus: user?.kycStatus,
      pathname,
      seenThisSession,
    });

    queueMicrotask(() => {
      if (!cancelled) {
        setKycReminder({ contextKey: reminderContextKey, status: shouldOpen ? 'open' : 'hidden' });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    hasHydrated,
    isAuthenticated,
    pathname,
    reminderContextKey,
    user?.emailVerification,
    user?.id,
    user?.kycStatus,
    user?.role,
  ]);

  const rememberKycReminder = () => {
    if (user?.id) sessionStorage.setItem(getKycReminderStorageKey(user.id), 'true');
  };

  const handleKycLater = () => {
    rememberKycReminder();
    setKycReminder({ contextKey: reminderContextKey, status: 'hidden' });
  };

  const handleKycVerify = () => {
    if (!user || !isTourRole(user.role)) return;
    rememberKycReminder();
    setKycReminder({ contextKey: reminderContextKey, status: 'navigating' });
    router.push(`/dashboard/${user.role}/verification`);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    hasHydrated,
    isWrongRole,
    isRedirecting,
    isEmailUnverified,
    kycReminder,
    isReminderResolved,
    isKycExperienceBlocking,
    pathname,
    handleKycLater,
    handleKycVerify,
  };
}
