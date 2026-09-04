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
  const userId = useAuthStore((state) => state.user?.id);
  const role = useAuthStore((state) => state.user?.role);
  const start = useTourStore((state) => state.start);
  const requestStart = useTourStore((state) => state.requestStart);

  const canStartTour = isTourRole(role);

  const startTour = useCallback((stepId?: string) => {
    if (!userId || !isTourRole(role)) return;

    const home = `/dashboard/${role}`;
    if (isDashboardHome(window.location.pathname, role)) {
      start(userId, role, stepId);
      return;
    }

    requestStart(userId, role, stepId);
    router.push(home);
  }, [userId, role, router, start, requestStart]);

  return { startTour, canStartTour };
}
