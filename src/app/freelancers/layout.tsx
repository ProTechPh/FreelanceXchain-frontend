import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Freelancers | FreelanceXchain',
  description: 'Hire pre-vetted Web3 freelancers, blockchain engineers, and smart contract developers with verified on-chain portfolios.',
};

export default function FreelancersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
