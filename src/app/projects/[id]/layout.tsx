import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project Details | FreelanceXchain',
  description: 'View project details, milestones, and submit proposals on FreelanceXchain.',
};

export default function ProjectDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
