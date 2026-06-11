'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function EmployerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
