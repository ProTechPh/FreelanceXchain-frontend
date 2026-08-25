import type { Metadata } from 'next';
import { Nunito_Sans } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'FreelanceXchain - Decentralized Freelance Marketplace & Smart Escrow',
  description: 'The AI-powered freelance marketplace with Ethereum smart contract escrow. Connect with verified employers, generate tailored milestone proposals, and get paid with zero escrow risk.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunitoSans.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
