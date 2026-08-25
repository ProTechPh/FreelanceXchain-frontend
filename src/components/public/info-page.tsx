import type { ReactNode } from 'react';
import Navbar from '@/components/ui/navbar';
import { FooterSection } from '@/components/ui/footer-section';
import { Sparkle } from '@phosphor-icons/react/dist/ssr';

export function InfoPage({
  title,
  intro,
  badge = "Documentation & Guidelines",
  children,
}: {
  title: string;
  intro: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="grow pt-28 sm:pt-36 pb-20">
        {/* Header Hero */}
        <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-12 text-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20 shadow-xs">
            <Sparkle className="size-3.5 fill-primary" weight="fill" />
            <span>{badge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
            {title}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {intro}
          </p>
        </section>

        {/* Content Card */}
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="rounded-3xl bg-card border border-border/80 shadow-lg shadow-black/5 p-6 sm:p-10 lg:p-12 prose prose-slate dark:prose-invert max-w-none space-y-8">
            {children}
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
