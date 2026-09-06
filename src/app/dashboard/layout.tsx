import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Dashboard | FreelanceXchain',
    template: '%s | FreelanceXchain',
  },
  description: 'Manage your freelance projects, contracts, payments, and reputation on FreelanceXchain.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
