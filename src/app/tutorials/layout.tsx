import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tutorials | FreelanceXchain',
  description: 'Step-by-step guides for freelancers and employers to get started with FreelanceXchain.',
};

export default function TutorialsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
