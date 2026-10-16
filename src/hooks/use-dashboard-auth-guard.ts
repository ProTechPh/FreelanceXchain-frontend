'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  getKycReminderStorageKey,
  shouldOfferKycReminder,
} from '@/lib/first-login-kyc';
import { isDashboardHome, isTourRole } from '@/lib/onboarding-tour';
import { getRoleSwitchTarget } from '@/lib/role-switch';
import { useRoleSwitchStore } from '@/stores/roleSwitchStore';
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
  const pendingRole = useRoleSwitchStore((state) => state.pendingRole);
  const setPendingRole = useRoleSwitchStore((state) => state.setPendingRole);
  // Just switched roles and still on the page being left: wait for the navigation.
  const isSwitchPending = isWrongRole && pendingRole !== null && pendingRole === user?.role;
  // A page from the participant's other role: offer to switch instead of redirecting.
  const roleSwitchTarget = isWrongRole && !isSwitchPending ? getRoleSwitchTarget(user?.role, allowedRoles) : null;
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
    if (hasHydrated && !isLoading && isAuthenticated && isWrongRole && user && !roleSwitchTarget && !isSwitchPending) {
      router.push(`/dashboard/${user.role}`);
    }
  }, [hasHydrated, isLoading, isAuthenticated, isWrongRole, user, router, roleSwitchTarget, isSwitchPending]);

  // The switch navigation has landed on a page the new role may view.
  useEffect(() => {
    if (pendingRole && user?.role === pendingRole && !isWrongRole) {
      setPendingRole(null);
    }
  }, [pendingRole, user?.role, isWrongRole, setPendingRole]);

  const isRedirecting =
    (hasHydrated && !isLoading && !isAuthenticated) ||
    (hasHydrated && !isLoading && isAuthenticated && isWrongRole && !roleSwitchTarget);

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
    roleSwitchTarget,
    isEmailUnverified,
    kycReminder,
    isReminderResolved,
    isKycExperienceBlocking,
    pathname,
    handleKycLater,
    handleKycVerify,
  };
}
