'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  LifeBuoy,
  PlayCircle,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Textarea } from '@/components/ui/textarea';
import { ListSkeleton } from '@/components/dashboard/skeletons';
import { PageHeader } from '@/components/dashboard/page-header';
import { AdminPermissionGate } from '@/components/admin/AdminPermissionGate';
import { supportTicketsApi } from '@/lib/api';
import { reportFailure, reportLoadFailure } from '@/lib/report-failure';
import { formatDateTime } from '@/lib/format';
import {
  MAX_RESOLUTION_LENGTH,
  TICKET_CATEGORY_LABELS,
} from '@/lib/support-tickets';
import type { AdminSupportTicket, SupportTicketStats, SupportTicketStatus } from '@/types';

const EMPTY_STATS: SupportTicketStats = { open: 0, in_progress: 0, resolved: 0, closed: 0 };

/** Filter cards, in lifecycle order — the queue reads left to right. */
const FILTERS = [
  { status: 'open', label: 'Open', icon: AlertCircle, color: 'yellow' },
  { status: 'in_progress', label: 'In progress', icon: Clock, color: 'blue' },
  { status: 'resolved', label: 'Resolved', icon: CheckCircle2, color: 'green' },
  { status: 'closed', label: 'Closed', icon: XCircle, color: 'red' },
] as const satisfies readonly { status: SupportTicketStatus; label: string; icon: React.ElementType; color: string }[];

const EMPTY_COPY: Record<SupportTicketStatus, string> = {
  open: 'Nothing is waiting on a reply right now.',
  in_progress: 'Nothing is being worked on right now.',
  resolved: 'Resolved tickets will collect here.',
  closed: 'Closed tickets will collect here.',
};

type PendingAction = {
  ticket: AdminSupportTicket;
  status: SupportTicketStatus;
};

/**
 * The support queue.
 *
 * Shaped after the KYC review page: stat cards double as the filter bar, an
 * action only stages a decision, and the write fires from the confirm dialog —
 * resolving a ticket sends the submitter a notification, so it should not be one
 * stray click away.
 */
export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [stats, setStats] = useState<SupportTicketStats>(EMPTY_STATS);
  const [filter, setFilter] = useState<SupportTicketStatus>('open');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [saving, setSaving] = useState(false);

  // One request: the endpoint returns the filter's rows and every filter's
  // count together. The spinner is raised here rather than in the effect so
  // switching filters shows a skeleton instead of the previous bucket's rows.
  const load = useCallback(async (status: SupportTicketStatus) => {
    setLoading(true);
    const { data } = await supportTicketsApi.adminList({ status });
    setTickets(data.tickets);
    setStats(data.stats);
  }, []);

  // Reported here rather than inside the loader so the toast's Retry can call
  // it again; a self-reference inside the callback is not allowed.
  useEffect(() => {
    let active = true;
    function run() {
      load(filter)
        .catch((error) => {
          if (active) reportLoadFailure(error, 'support tickets', run);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    run();
    return () => {
      active = false;
    };
  }, [load, filter]);

  const closePending = () => {
    setPending(null);
    setResolutionNote('');
  };

  const handleConfirm = async () => {
    if (!pending) return;

    const note = resolutionNote.trim();
    // The server rejects this too; catching it here saves a round trip that
    // would come back as a red toast over a dialog the admin must retype.
    if (pending.status === 'resolved' && !note) {
      toast.error('Write a reply before resolving — the submitter reads this.');
      return;
    }

    setSaving(true);
    try {
      await supportTicketsApi.adminUpdateStatus(pending.ticket.id, {
        status: pending.status,
        ...(note ? { resolutionNote: note } : {}),
      });
      toast.success(
        pending.status === 'resolved'
          ? 'Ticket resolved — the submitter has been notified.'
          : `Ticket moved to ${pending.status.replace('_', ' ')}.`
      );
      closePending();
      setExpandedId(null);
      // Both effects of the write are known exactly — the ticket leaves this
      // bucket and the two counts move by one — so they are applied locally.
      // Reloading the queue instead made every decision wait on a round trip
      // that could only confirm what the response already said.
      const from = pending.ticket.status;
      const to = pending.status;
      setTickets((current) => current.filter((t) => t.id !== pending.ticket.id));
      setStats((current) => ({ ...current, [from]: Math.max(0, current[from] - 1), [to]: current[to] + 1 }));
    } catch (error) {
      reportFailure(error, 'update this ticket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPermissionGate permission="support:manage" title="Support Tickets">
      <div className="space-y-6">
      <PageHeader
        title="Support tickets"
        description="Questions freelancers and employers have sent from Help & Support. Resolving one notifies the submitter and shows them your reply."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {FILTERS.map((item) => (
          <StatCard
            key={item.status}
            icon={item.icon}
            label={item.label}
            count={stats[item.status]}
            color={item.color}
            active={filter === item.status}
            onClick={() => setFilter(item.status)}
          />
        ))}
      </div>

      {loading ? (
        <ListSkeleton rows={4} label="Loading support tickets" />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title={`No ${FILTERS.find((f) => f.status === filter)?.label.toLowerCase()} tickets`}
          description={EMPTY_COPY[filter]}
        />
      ) : (
        <ul className="space-y-3">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <TicketCard
                ticket={ticket}
                expanded={expandedId === ticket.id}
                onToggle={() => setExpandedId((id) => (id === ticket.id ? null : ticket.id))}
                onAct={(status) => {
                  setPending({ ticket, status });
                  setResolutionNote('');
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          // Never close mid-write: the admin would not know whether the
          // submitter was notified.
          if (!open && !saving) closePending();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {pending?.status === 'resolved'
                ? 'Resolve this ticket'
                : pending?.status === 'closed'
                  ? 'Close this ticket'
                  : 'Start work on this ticket'}
            </DialogTitle>
            <DialogDescription>
              {pending?.status === 'resolved'
                ? 'Your reply is shown to the submitter and they are notified in the app.'
                : pending?.status === 'closed'
                  ? 'Closing ends the ticket without a reply. Add a note if it would help them understand why.'
                  : 'Marks the ticket as being looked at. The submitter sees the change on their support page.'}
            </DialogDescription>
          </DialogHeader>

          {pending && (
            <div className="space-y-3 py-2">
              <div className="rounded-md border border-border bg-muted/40 p-3">
                <p className="text-sm font-semibold text-foreground">{pending.ticket.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {pending.ticket.userName} · {pending.ticket.userEmail}
                </p>
              </div>

              {pending.status !== 'in_progress' && (
                <div className="space-y-2">
                  <label htmlFor="resolution-note" className="text-sm font-medium">
                    Reply to the submitter
                    {pending.status === 'closed' && (
                      <span className="text-muted-foreground"> (optional)</span>
                    )}
                  </label>
                  <Textarea
                    id="resolution-note"
                    value={resolutionNote}
                    onChange={(event) => setResolutionNote(event.target.value)}
                    rows={5}
                    maxLength={MAX_RESOLUTION_LENGTH}
                    placeholder="What you found, and what happens next."
                    disabled={saving}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={closePending} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant={pending?.status === 'closed' ? 'destructive' : 'gradient'}
              onClick={handleConfirm}
              loading={saving}
              loadingText="Saving…"
            >
              {pending?.status === 'resolved'
                ? 'Resolve & notify'
                : pending?.status === 'closed'
                  ? 'Close ticket'
                  : 'Start work'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AdminPermissionGate>
  );
}

function StatCard({
  icon: Icon,
  label,
  count,
  color,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  const colorMap: Record<string, string> = {
    yellow: 'bg-warning-subtle',
    blue: 'bg-info-subtle',
    green: 'bg-success-subtle',
    red: 'bg-destructive-subtle',
  };
  const iconColorMap: Record<string, string> = {
    yellow: 'text-warning',
    blue: 'text-info',
    green: 'text-success',
    red: 'text-destructive',
  };

  return (
    <Card
      className={`bg-card border-border transition-all ${active ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`}
    >
      {/* A real button rather than a click handler on the card: this is the
          page's filter control and has to be reachable by keyboard. */}
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className="w-full rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${colorMap[color]}`}
            >
              <Icon className={`size-5 ${iconColorMap[color]}`} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums">{count}</p>
              <p className="truncate text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        </CardContent>
      </button>
    </Card>
  );
}

function TicketCard({
  ticket,
  expanded,
  onToggle,
  onAct,
}: {
  ticket: AdminSupportTicket;
  expanded: boolean;
  onToggle: () => void;
  onAct: (status: SupportTicketStatus) => void;
}) {
  const isActive = ticket.status === 'open' || ticket.status === 'in_progress';

  return (
    <Card className="bg-card border-border">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{ticket.subject}</p>
            <p className="truncate text-xs text-muted-foreground">
              {ticket.userName} · {ticket.userEmail} · {ticket.userRole}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge className="bg-muted text-muted-foreground">
              {TICKET_CATEGORY_LABELS[ticket.category] ?? ticket.category}
            </Badge>
            <StatusBadge status={ticket.status} domain="support" showDot />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{formatDateTime(ticket.createdAt)}</p>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex items-center gap-1 rounded-md text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {expanded ? 'Hide details' : 'Read the full report'}
          <ChevronDown
            className={`size-4 transition-transform duration-fast ${expanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {expanded && (
          <div className="space-y-3">
            <p className="whitespace-pre-wrap break-words rounded-md border border-border bg-muted/40 p-3 text-sm">
              {ticket.description}
            </p>
            {ticket.resolutionNote && (
              <div className="rounded-md border border-success-border bg-success-subtle p-3">
                <p className="mb-1 text-xs font-semibold text-success">Reply sent</p>
                <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                  {ticket.resolutionNote}
                </p>
              </div>
            )}
          </div>
        )}

        {isActive && (
          <div className="flex flex-wrap gap-2 pt-1">
            {ticket.status === 'open' && (
              <Button size="sm" variant="outline" onClick={() => onAct('in_progress')}>
                <PlayCircle className="size-4" aria-hidden="true" />
                Start work
              </Button>
            )}
            <Button size="sm" variant="gradient" onClick={() => onAct('resolved')}>
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Resolve…
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onAct('closed')}>
              <XCircle className="size-4" aria-hidden="true" />
              Close
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
