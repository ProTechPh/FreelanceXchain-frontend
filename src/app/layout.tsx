import type { Metadata, Viewport } from 'next';
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
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/images/logo-icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

// Declared explicitly rather than relying on the framework default: `viewportFit`
// is what lets a full-bleed surface reach under a notch, and pinch-zoom is left
// unrestricted because capping it fails WCAG 1.4.4.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunitoSans.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
