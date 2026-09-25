'use client';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { EmailVerificationGate } from './EmailVerificationGate';
import { OnboardingTour } from '@/components/onboarding/onboarding-tour';
import { useSuppressRatingPrompt } from '@/components/feedback/rate-app-provider';
import { FirstLoginKycReminder } from '@/components/kyc/first-login-kyc-reminder';
import { isTourRole } from '@/lib/onboarding-tour';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';
import { useDashboardAuthGuard } from '@/hooks/use-dashboard-auth-guard';
import { DashboardLayoutSkeleton, DashboardRedirectSpinner } from './dashboard-layout-skeleton';

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** If provided, only these roles may view this section — everyone else is redirected to their own dashboard home. */
  allowedRoles?: UserRole[];
}

export function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
  const {
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
  } = useDashboardAuthGuard({ allowedRoles });

  // The provider lives at the app root (it also covers the public project
  // pages). Only the dashboard knows about these gates, so it reports them:
  // a prompt must never appear behind the email-verification blur.
  useSuppressRatingPrompt(isEmailUnverified || isKycExperienceBlocking);

  if (!hasHydrated || isLoading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!isAuthenticated || isWrongRole) {
    return isRedirecting ? <DashboardRedirectSpinner /> : null;
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
          className={cn(
            "min-w-0 flex-1 outline-none",
            pathname?.includes('/messages')
              ? "px-2 pt-1 pb-0 sm:px-4 sm:pt-2 sm:pb-0 lg:px-6 lg:py-4 lg:pb-6 overflow-hidden"
              : "px-4 py-4 sm:px-6 sm:py-6 lg:px-(--space-page-x) pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-6"
          )}
        >
          {children}
        </main>
        <BottomNav role={user?.role} permissions={user?.permissions} />
      </div>
    </div>
  );
}
