import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Employer Profile | FreelanceXchain',
  description: 'View employer profile, posted projects, and reputation on FreelanceXchain.',
};

export default function EmployerDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
