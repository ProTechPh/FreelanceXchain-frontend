'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { isDashboardHome, isTourRole } from '@/lib/onboarding-tour';
import { useAuthStore } from '@/stores/authStore';
import { useTourStore } from '@/stores/tourStore';

/**
 * Starts the onboarding tour from anywhere in the dashboard.
 *
 * The steps point at the dashboard home's own controls, so a replay triggered
 * from Settings navigates there first and the tour picks itself up on arrival
 * (see the `pendingRole` handoff in `OnboardingTour`).
 */
export function useStartTour() {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const start = useTourStore((state) => state.start);
  const requestStart = useTourStore((state) => state.requestStart);

  const canStartTour = isTourRole(role);

  const startTour = useCallback((stepId?: string) => {
    if (!isTourRole(role)) return;

    const home = `/dashboard/${role}`;
    if (isDashboardHome(window.location.pathname, role)) {
      start(role, stepId);
      return;
    }

    requestStart(role, stepId);
    router.push(home);
  }, [role, router, start, requestStart]);

  return { startTour, canStartTour };
}
