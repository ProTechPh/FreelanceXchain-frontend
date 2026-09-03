import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

import Navbar from '@/components/layout/navbar';
import { FooterSection } from '@/components/layout/footer-section';

interface PublicMarketplaceShellProps {
  /** Small pill above the headline. */
  eyebrow: string;
  headline: ReactNode;
  description: string;
  children: ReactNode;
}

/**
 * Public marketing chrome for the marketplace routes.
 *
 * `MarketplaceBrowser` used to bake this in, which forced the same navbar, hero
 * and footer onto the in-app dashboard view. Keeping the chrome here means the
 * public and dashboard surfaces can diverge as much as they should while sharing
 * one search implementation.
 */
export function PublicMarketplaceShell({
  eyebrow,
  headline,
  description,
  children,
}: PublicMarketplaceShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main id="marketplace-content" tabIndex={-1} className="grow pt-28 pb-20 outline-none sm:pt-36">
        <section className="mx-auto mb-10 max-w-7xl px-6 text-center lg:px-8">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-subtle px-3.5 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span>{eyebrow}</span>
          </p>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {headline}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
      </main>

      <FooterSection />
    </div>
  );
}
