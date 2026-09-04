'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { EmailVerificationGate } from './EmailVerificationGate';
import { OnboardingTour } from '@/components/onboarding/onboarding-tour';
import { FirstLoginKycReminder } from '@/components/kyc/first-login-kyc-reminder';
import {
  getKycReminderStorageKey,
  shouldOfferKycReminder,
} from '@/lib/first-login-kyc';
import { isDashboardHome, isTourRole } from '@/lib/onboarding-tour';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** If provided, only these roles may view this section — everyone else is redirected to their own dashboard home. */
  allowedRoles?: UserRole[];
}

export function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
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
  const isKycExperienceBlocking = isParticipantHome && (
    !isReminderResolved || kycReminder.status === 'open' || kycReminder.status === 'navigating'
  );

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

    return () => { cancelled = true; };
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

  if (!hasHydrated || isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen flex-col items-center justify-center gap-3"
      >
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
      </div>
    );
  }

  if (!isAuthenticated || isWrongRole) {
    return null;
  }

  return (
    <div className="flex min-h-screen relative">
      {/* If email is unverified, show the Gate Modal and lock the dashboard */}
      {isEmailUnverified && <EmailVerificationGate />}

      {user && isTourRole(user.role) && (
        <FirstLoginKycReminder
          open={isReminderResolved && kycReminder.status === 'open'}
          role={user.role}
          onLater={handleKycLater}
          onVerify={handleKycVerify}
        />
      )}

      {/* Renders nothing unless the tour is actually running. `suppressed` is
          the same flag that blurs the dashboard, so the two can never disagree
          about whether a tour may run. */}
      <OnboardingTour suppressed={isEmailUnverified || isKycExperienceBlocking} />

      {/* Keyboard users land here first: one Tab skips the whole sidebar and
          top bar, which is otherwise ~20 stops before any page content. */}
      <a
        href="#dashboard-content"
        className="sr-only z-50 focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <div className={isEmailUnverified ? 'pointer-events-none select-none blur-[2px] opacity-40' : ''}>
        <Sidebar />
      </div>
      <div className={`flex min-w-0 flex-1 flex-col ${isEmailUnverified ? 'pointer-events-none select-none blur-[2px] opacity-40' : ''}`}>
        <TopBar />
        <main
          id="dashboard-content"
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-(--space-page-x) outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
