'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import type { AdminPermission } from '@/types';

interface AdminPermissionGateProps {
  permission: AdminPermission | AdminPermission[];
  mode?: 'all' | 'any';
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function AdminPermissionGate({
  permission,
  mode = 'all',
  title,
  description,
  children,
}: AdminPermissionGateProps) {
  const { isLoading, hasAnyPermission, hasAllPermissions } = useAdminPermissions();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const permissionsList = Array.isArray(permission) ? permission : [permission];
  const isAllowed =
    mode === 'any'
      ? hasAnyPermission(...permissionsList)
      : hasAllPermissions(...permissionsList);

  if (isAllowed) {
    return <>{children}</>;
  }

  const formattedRequired = permissionsList.join(', ');

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
      <Card className="max-w-md w-full border-border bg-card shadow-sm">
        <CardContent className="pt-8 pb-8 px-6 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
            <ShieldAlert className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Access Restricted</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {description ||
              `You do not have the required permission (${formattedRequired}) to access ${
                title || 'this section'
              }. Contact a Super Admin to adjust your permissions.`}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full justify-center">
            <Button variant="outline" asChild className="gap-2">
              <Link href="/dashboard/admin">
                <ArrowLeft className="h-4 w-4" />
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
