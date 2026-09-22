'use client';

import { useMemo, useState } from 'react';
import { Search, HelpCircle } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { countFaqItems, searchFaq } from '@/lib/support-faq';

/**
 * The searchable FAQ shown above the ticket form.
 *
 * The search is deliberately in front of the questions rather than behind a
 * "browse all" step: someone who opens this page already has a specific problem,
 * and making them scan seven sections for it is how a help centre earns a ticket
 * it did not need to receive.
 */
export function SupportFaqSection() {
  const [query, setQuery] = useState('');

  const sections = useMemo(() => searchFaq(query), [query]);
  const matchCount = countFaqItems(sections);
  const total = countFaqItems();
  const searching = query.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Frequently asked questions
        </h2>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {searching ? `${matchCount} of ${total} matching` : `${total} answers`}
        </p>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <label htmlFor="support-faq-search" className="sr-only">
          Search the FAQ
        </label>
        <Input
          id="support-faq-search"
          type="search"
          placeholder="Search — escrow, verification, payouts…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-10"
        />
      </div>

      {sections.length === 0 ? (
        <EmptyState
          size="sm"
          icon={HelpCircle}
          title="No answer matches that"
          description="Try a different word, or submit a ticket and we will answer it directly."
        />
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} aria-labelledby={`faq-${section.title}`}>
              <h3
                id={`faq-${section.title}`}
                className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {section.title}
              </h3>
              {/* Remounted per query so a search never leaves an entry that no
                  longer matches sitting open behind the new results. */}
              <Accordion key={query} type="single" collapsible>
                {section.items.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className="text-sm">{item.question}</AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
