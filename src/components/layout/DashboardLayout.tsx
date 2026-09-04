'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { EmailVerificationGate } from './EmailVerificationGate';
import { OnboardingTour } from '@/components/onboarding/onboarding-tour';
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

  const isWrongRole = !!(allowedRoles && user && !allowedRoles.includes(user.role));
  const isEmailUnverified = !!(user && user.role !== 'admin' && user.emailVerification === false);

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

      {/* Renders nothing unless the tour is actually running. `suppressed` is
          the same flag that blurs the dashboard, so the two can never disagree
          about whether a tour may run. */}
      <OnboardingTour suppressed={isEmailUnverified} />

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
