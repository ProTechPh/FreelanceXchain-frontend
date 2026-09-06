import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Projects | FreelanceXchain',
  description: 'Discover verified Web3 projects with smart contract escrow protection. Browse freelance opportunities secured by blockchain.',
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
