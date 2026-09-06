import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crypto News | FreelanceXchain',
  description: 'Stay updated with the latest Web3, blockchain, and crypto news from the FreelanceXchain ecosystem.',
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
