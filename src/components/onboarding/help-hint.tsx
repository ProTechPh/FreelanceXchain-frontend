'use client';

import { useId, useState } from 'react';
import { CircleHelp } from 'lucide-react';

import { cn } from '@/lib/utils';
import { HELP_TOPICS, type HelpTopicId } from '@/lib/help-topics';
import { useStartTour } from './tour-launcher';

/**
 * An inline "what does this mean?" next to a control that needs one.
 *
 * A disclosure rather than a tooltip on purpose: a tooltip never opens on touch,
 * and `skill.md` forbids one being the only way to read something. This opens on
 * click, on any input, and cannot overflow because it lays out in the flow.
 */
export function HelpHint({ topic, className }: { topic: HelpTopicId; className?: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { startTour, canStartTour } = useStartTour();
  const { question, answer, step } = HELP_TOPICS[topic];

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex w-fit items-center gap-1.5 rounded-md text-2xs font-semibold text-muted-foreground',
          'transition-colors duration-fast ease-out outline-none',
          'hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          open && 'text-foreground',
        )}
      >
        <CircleHelp className="size-3.5 shrink-0" aria-hidden="true" />
        {question}
      </button>

      {open && (
        <div
          id={panelId}
          className="rounded-md border border-border bg-muted/60 p-2.5 text-xs leading-relaxed text-muted-foreground"
        >
          <p>{answer}</p>
          {step && canStartTour && (
            <button
              type="button"
              onClick={() => startTour(step)}
              className={cn(
                'mt-2 inline-flex w-fit items-center rounded-md text-2xs font-semibold text-primary underline underline-offset-2',
                'transition-colors duration-fast ease-out outline-none',
                'hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              )}
            >
              Show me in the tour
            </button>
          )}
        </div>
      )}
    </div>
  );
}
