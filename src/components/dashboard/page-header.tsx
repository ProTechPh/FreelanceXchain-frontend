import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Primary action(s) for the page, right-aligned on wide screens. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Standard dashboard page header.
 *
 * Dashboard pages sit inside the app shell, which already carries the product
 * identity — so this is a working header, not a marketing hero: one `h1`, one
 * line of orientation, and the page's actions. Both role dashboards use it so an
 * employer and a freelancer see the same structure.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
