import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Freelancer Profile | FreelanceXchain',
  description: 'View freelancer profile, skills, portfolio, and reputation on FreelanceXchain.',
};

export default function FreelancerDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
