'use client';

import { useAuthStore } from '@/stores/authStore';
import type { AdminPermission } from '@/types';

export function useAdminPermissions() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const isAdmin = user?.role === 'admin';
  const permissions = user?.permissions;

  // Super Admin check:
  // If user is admin and has no explicit permissions array set (legacy full admin),
  // or includes '*' or 'admin:manage', they possess full access.
  // Note: an explicit array (including empty array []) means granular permissions are active and enforced.
  const isSuperAdmin = Boolean(
    isAdmin &&
      (permissions === undefined ||
        (permissions as string[]).includes('*') ||
        permissions.includes('admin:manage'))
  );

  const hasPermission = (permission: AdminPermission): boolean => {
    if (!isAdmin) return false;
    if (isSuperAdmin) return true;
    return Boolean(permissions?.includes(permission));
  };

  const hasAnyPermission = (...required: AdminPermission[]): boolean => {
    if (!isAdmin) return false;
    if (isSuperAdmin) return true;
    return required.some(hasPermission);
  };

  const hasAllPermissions = (...required: AdminPermission[]): boolean => {
    if (!isAdmin) return false;
    if (isSuperAdmin) return true;
    return required.every(hasPermission);
  };

  return {
    user,
    isLoading: isLoading || !hasHydrated,
    isAdmin,
    isSuperAdmin,
    permissions: permissions ?? [],
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
