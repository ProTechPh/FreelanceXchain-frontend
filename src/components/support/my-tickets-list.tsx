'use client';

import { LifeBuoy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/lib/format';
import { TICKET_CATEGORY_LABELS, TICKET_STATUS_HINTS } from '@/lib/support-tickets';
import type { SupportTicket } from '@/types';

type MyTicketsListProps = {
  tickets: SupportTicket[];
};

/**
 * The submitter's own tickets.
 *
 * The admin's reply is the point of this list, so it is rendered in full rather
 * than truncated behind a "view" step — someone checking back is here to read
 * the answer, not to navigate to it.
 */
export function MyTicketsList({ tickets }: MyTicketsListProps) {
  if (tickets.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon={LifeBuoy}
        title="No tickets yet"
        description="If an answer above does not cover it, submit a ticket and we will reply here."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <Card className="bg-card border-border">
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {TICKET_CATEGORY_LABELS[ticket.category] ?? ticket.category} ·{' '}
                    {formatDate(ticket.createdAt)}
                  </p>
                </div>
                <StatusBadge status={ticket.status} domain="support" showDot />
              </div>

              <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {ticket.description}
              </p>

              {ticket.resolutionNote ? (
                <div className="rounded-md border border-success-border bg-success-subtle p-3">
                  <p className="mb-1 text-xs font-semibold text-success">
                    Reply from the FreelanceXchain team
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                    {ticket.resolutionNote}
                  </p>
                </div>
              ) : (
                <Badge className="bg-muted text-muted-foreground">
                  {TICKET_STATUS_HINTS[ticket.status]}
                </Badge>
              )}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
