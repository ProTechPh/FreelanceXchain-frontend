import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function InfoPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50"><div className="mx-auto max-w-4xl px-6 py-14"><h1 className="text-4xl font-bold">{title}</h1><p className="mt-4 max-w-2xl text-lg text-muted-foreground">{intro}</p></div></header>
      <div className="mx-auto max-w-4xl px-6 py-10"><Card><CardContent className="prose max-w-none space-y-8 p-6 text-foreground dark:prose-invert sm:p-10">{children}</CardContent></Card></div>
    </main>
  );
}
