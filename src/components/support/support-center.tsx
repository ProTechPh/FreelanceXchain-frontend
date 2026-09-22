'use client';

import { useCallback, useEffect, useState } from 'react';
import { LifeBuoy, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ListSkeleton } from '@/components/dashboard/skeletons';
import { PageHeader } from '@/components/dashboard/page-header';
import { MyTicketsList } from './my-tickets-list';
import { SubmitTicketDialog } from './submit-ticket-dialog';
import { SupportFaqSection } from './support-faq-section';
import { supportTicketsApi } from '@/lib/api';
import { reportLoadFailure } from '@/lib/report-failure';
import type { SupportTicket } from '@/types';

/**
 * Help & Support, shared verbatim by the freelancer and employer routes.
 *
 * Nothing here branches on role: both sides file tickets the same way and the
 * server derives who they are from the session. Two thin route files render
 * this so each role keeps its own dashboard URL.
 *
 * The FAQ sits above the form on purpose — the cheapest ticket is the one
 * answered before it is written.
 */
export function SupportCenter() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supportTicketsApi.listMine();
    setTickets(data);
  }, []);

  // Reported here rather than inside the loader so the toast's Retry can call
  // it again; a self-reference inside the callback is not allowed.
  useEffect(() => {
    let active = true;
    function run() {
      load()
        .catch((error) => {
          if (active) reportLoadFailure(error, 'your support tickets', run);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    run();
    return () => {
      active = false;
    };
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & Support"
        description="Find an answer below, or send us a ticket and we will reply here."
        actions={
          <Button variant="gradient" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Submit a ticket
          </Button>
        }
      />

      <Card className="bg-card border-border">
        <CardContent className="p-4 sm:p-6">
          <SupportFaqSection />
        </CardContent>
      </Card>

      <section className="space-y-4" aria-labelledby="your-tickets">
        <div className="flex items-center gap-2">
          <LifeBuoy className="size-5 text-muted-foreground" aria-hidden="true" />
          <h2 id="your-tickets" className="text-lg font-bold tracking-tight text-foreground">
            Your tickets
          </h2>
        </div>
        {loading ? (
          <ListSkeleton rows={2} label="Loading your support tickets" />
        ) : (
          <MyTicketsList tickets={tickets} />
        )}
      </section>

      <SubmitTicketDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        // The POST returns the stored ticket, so it goes straight to the top of
        // the list. Refetching here meant the submitter watched a spinner for a
        // second round trip that could only tell them what they already had.
        onSubmitted={(ticket) => setTickets((current) => [ticket, ...current])}
      />
    </div>
  );
}
