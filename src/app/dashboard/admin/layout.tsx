'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout allowedRoles={['admin']}>{children}</DashboardLayout>;
}
