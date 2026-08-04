'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || isWrongRole) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
