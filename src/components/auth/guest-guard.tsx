'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface GuestGuardProps {
  children: React.ReactNode;
}

/**
 * GuestGuard ensures that already authenticated users cannot access guest-only
 * pages (such as /login, /register, /forgot-password, /passwordless, etc.).
 *
 * If an active session is detected, the user is immediately redirected to
 * their role-specific dashboard (/dashboard/freelancer, /dashboard/employer, /dashboard/admin).
 */
export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, loadUser } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (token) {
        loadUser();
      }
    }
  }, [hasHydrated, isAuthenticated, loadUser]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && user) {
      router.replace(`/dashboard/${user.role || 'freelancer'}`);
    }
  }, [hasHydrated, isAuthenticated, user, router]);

  // While rehydrating state or if currently authenticated (redirect in flight),
  // render a loading indicator to prevent flashing guest forms or allowing interaction.
  if (!hasHydrated || (isAuthenticated && user)) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background"
      >
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
      </div>
    );
  }

  return <>{children}</>;
}
