'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Archive,
  ArchiveRestore,
  BadgeCheck,
  Check,
  ChevronRight,
  FileCheck2,
  FileClock,
  FileText,
  FileSignature,
  FileX2,
  Handshake,
  Hourglass,
  Inbox,
  LifeBuoy,
  MessageSquare,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Undo2,
  Wallet,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip } from '@/components/ui/tooltip';
import { SwipeActions } from '@/components/ui/swipe-actions';
import { getNotificationDestination } from '@/lib/notification-route';
import { formatDateTime, formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType, UserRole } from '@/types';

export type Category = 'Proposal' | 'Contract' | 'Milestone' | 'Payment' | 'Dispute' | 'Refund' | 'Rush upgrade' | 'Review' | 'Message' | 'Discovery' | 'Support';

type NotificationStyle = { icon: LucideIcon; color: string; bg: string; category: Category };

const INFO = { color: 'text-info', bg: 'bg-info-subtle' };
const SUCCESS = { color: 'text-success', bg: 'bg-success-subtle' };
const WARNING = { color: 'text-warning', bg: 'bg-warning-subtle' };
const DANGER = { color: 'text-destructive', bg: 'bg-destructive-subtle' };
const BRAND = { color: 'text-primary', bg: 'bg-primary/10' };

const ICON_BY_TYPE: Record<NotificationType, NotificationStyle> = {
  proposal_received: { icon: Inbox, ...INFO, category: 'Proposal' },
  proposal_accepted: { icon: BadgeCheck, ...SUCCESS, category: 'Proposal' },
  proposal_rejected: { icon: XCircle, ...DANGER, category: 'Proposal' },
  milestone_submitted: { icon: FileClock, ...INFO, category: 'Milestone' },
  milestone_approved: { icon: FileCheck2, ...SUCCESS, category: 'Milestone' },
  milestone_rejected: { icon: FileX2, ...DANGER, category: 'Milestone' },
  payment_released: { icon: Wallet, ...SUCCESS, category: 'Payment' },
  dispute_created: { icon: ShieldAlert, ...WARNING, category: 'Dispute' },
  dispute_evidence_submitted: { icon: FileText, ...WARNING, category: 'Dispute' },
  dispute_resolved: { icon: ShieldCheck, ...SUCCESS, category: 'Dispute' },
  refund_requested: { icon: Undo2, ...WARNING, category: 'Refund' },
  refund_approved: { icon: Undo2, ...SUCCESS, category: 'Refund' },
  refund_rejected: { icon: Undo2, ...DANGER, category: 'Refund' },
  rush_upgrade_requested: { icon: Zap, ...BRAND, category: 'Rush upgrade' },
  rush_upgrade_accepted: { icon: Zap, ...SUCCESS, category: 'Rush upgrade' },
  rush_upgrade_declined: { icon: Zap, ...DANGER, category: 'Rush upgrade' },
  rush_upgrade_counter_offered: { icon: Zap, ...WARNING, category: 'Rush upgrade' },
  contract_offer_received: { icon: Handshake, ...INFO, category: 'Contract' },
  contract_offer_accepted: { icon: Handshake, ...SUCCESS, category: 'Contract' },
  contract_offer_declined: { icon: Handshake, ...DANGER, category: 'Contract' },
  contract_negotiation_cancelled: { icon: XCircle, ...DANGER, category: 'Contract' },
  contract_signature_requested: { icon: FileSignature, ...WARNING, category: 'Contract' },
  contract_signed: { icon: FileSignature, ...SUCCESS, category: 'Contract' },
  contract_awaiting_funding: { icon: Wallet, ...WARNING, category: 'Contract' },
  contract_funding_reminder: { icon: Hourglass, ...WARNING, category: 'Contract' },
  contract_funding_expired: { icon: Hourglass, ...DANGER, category: 'Contract' },
  contract_activated: { icon: BadgeCheck, ...SUCCESS, category: 'Contract' },
  rating_received: { icon: Star, ...WARNING, category: 'Review' },
  message: { icon: MessageSquare, ...BRAND, category: 'Message' },
  saved_search_match: { icon: Search, ...BRAND, category: 'Discovery' },
  project_match: { icon: Sparkles, ...BRAND, category: 'Discovery' },
  support_ticket_resolved: { icon: LifeBuoy, ...SUCCESS, category: 'Support' },
};

const FALLBACK_STYLE: NotificationStyle = { icon: FileText, ...BRAND, category: 'Support' };

export const CATEGORY_ORDER: Category[] = ['Proposal', 'Contract', 'Milestone', 'Payment', 'Dispute', 'Refund', 'Rush upgrade', 'Review', 'Message', 'Discovery', 'Support'];

export function categoryOf(notification: Notification): Category {
  return (ICON_BY_TYPE[notification.type] ?? FALLBACK_STYLE).category;
}

/**
 * Archive is filing, not judging — so it takes the neutral surface; delete is
 * irreversible once the undo window closes, so it takes destructive red.
 */
export const ARCHIVE_SURFACE = 'bg-neutral text-neutral-foreground';
export const DELETE_SURFACE = 'bg-destructive text-destructive-foreground';

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return 'recently';
  return formatRelativeTime(iso);
}

/**
 * Backend messages quote the project and milestone names ("Architecture
 * Spec…"). Lifting those out of the muted body text lets the eye find *which*
 * project a notification is about without reading the whole sentence.
 */
function emphasizeQuoted(message: string): ReactNode {
  const parts = message.split(/("[^"]+"|“[^”]+”)/g);
  if (parts.length === 1) return message;
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className="font-medium text-foreground">{part}</span>
    ) : (
      part
    ),
  );
}

function RowAction({
  label,
  context,
  icon: Icon,
  onClick,
  tone = 'default',
}: {
  label: string;
  /** Names the row, so a screen-reader list of buttons isn't twenty identical "Delete"s. */
  context: string;
  icon: LucideIcon;
  onClick: () => void;
  tone?: 'default' | 'destructive';
}) {
  return (
    <Tooltip content={label}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`${label}: ${context}`}
        onClick={onClick}
        className={cn(tone === 'destructive' && 'hover:bg-destructive-subtle hover:text-destructive')}
      >
        <Icon className="size-4" aria-hidden="true" />
      </Button>
    </Tooltip>
  );
}

export function NotificationRow({
  notification,
  role,
  index,
  archived,
  onOpen,
  onMarkRead,
  onArchiveToggle,
  onDelete,
  selecting = false,
  selected = false,
  onToggleSelect,
  onLongPress,
}: {
  notification: Notification;
  role: UserRole | undefined;
  index: number;
  /** True in the Archived view: the archive gesture and button become "Restore". */
  archived: boolean;
  onOpen: (notification: Notification) => void;
  onMarkRead: (notification: Notification) => void;
  onArchiveToggle: (notification: Notification) => void;
  onDelete: (notification: Notification) => void;
  /** Selection mode: the row becomes a checkbox target; swipe and row actions step aside. */
  selecting?: boolean;
  selected?: boolean;
  onToggleSelect?: (notification: Notification) => void;
  onLongPress?: (notification: Notification) => void;
}) {
  const { icon: Icon, color, bg, category } = ICON_BY_TYPE[notification.type] ?? FALLBACK_STYLE;
  const destination = role ? getNotificationDestination(notification, role) : null;
  const unread = !notification.isRead;
  const time = relativeTime(notification.createdAt);
  const exactTime = notification.createdAt ? formatDateTime(notification.createdAt) : undefined;
  const archiveLabel = archived ? 'Restore' : 'Archive';

  // Stretched-target pattern: the link (or button) wraps only the title, and
  // its ::after covers the whole row. That keeps the row one big hit area while
  // the row actions sit beside it instead of inside it — nesting a button in a
  // link is invalid and breaks screen readers.
  const stretched = cn(
    'outline-none after:absolute after:inset-0',
    'focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring',
  );
  const titleText = (
    <>
      {notification.title}
      {unread && <span className="sr-only"> (unread)</span>}
    </>
  );

  return (
    <SwipeActions
      disabled={selecting}
      onLongPress={onLongPress ? () => onLongPress(notification) : undefined}
      startAction={{ label: 'Delete', icon: Trash2, className: DELETE_SURFACE, onCommit: () => onDelete(notification) }}
      endAction={{
        label: archiveLabel,
        icon: archived ? ArchiveRestore : Archive,
        className: ARCHIVE_SURFACE,
        onCommit: () => onArchiveToggle(notification),
      }}
    >
      <div
        className={cn(
          'animate-element group relative flex items-start gap-3 px-4 py-4 transition-colors duration-(--duration-fast) sm:gap-4 sm:px-5',
          'hover:bg-muted/60 active:bg-muted',
          unread && 'bg-primary-subtle/50',
          selecting && 'select-none',
          selected && 'bg-primary-subtle ring-1 ring-inset ring-primary/40 hover:bg-primary-subtle',
        )}
        style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
      >
        {unread && <span aria-hidden="true" className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-primary" />}

        {selecting && (
          <>
            {/* The whole row is the hit area: a pointer-only button covers it
                and toggles selection. The checkbox stays the one control for
                keyboard and screen readers, so the overlay is hidden from both,
                and it sits above the row's positioned parts (icon tile, unread
                bar) while the checkbox sits above it. */}
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              onClick={() => onToggleSelect?.(notification)}
              className="absolute inset-0 z-10 cursor-pointer outline-none"
            />
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect?.(notification)}
              aria-label={`Select: ${notification.title}`}
              className="relative z-20 mt-3 size-5"
            />
          </>
        )}

        <div aria-hidden="true" className="relative shrink-0">
          <div className={cn('flex size-10 items-center justify-center rounded-xl ring-1 ring-inset ring-foreground/5 sm:size-11', bg)}>
            <Icon className={cn('size-5', color)} />
          </div>
          {unread && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary ring-2 ring-card" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <p className={cn('min-w-0 text-sm leading-snug text-foreground', unread ? 'font-semibold' : 'font-medium')}>
              {selecting ? (
                titleText
              ) : destination ? (
                <Link href={destination} className={stretched} onClick={() => onOpen(notification)}>
                  {titleText}
                </Link>
              ) : unread ? (
                <button type="button" className={cn(stretched, 'text-left')} onClick={() => onOpen(notification)}>
                  {titleText}
                </button>
              ) : (
                titleText
              )}
            </p>
            <time
              dateTime={notification.createdAt}
              title={exactTime}
              className="hidden shrink-0 whitespace-nowrap text-xs text-muted-foreground tabular-nums sm:block"
            >
              {time}
            </time>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-pretty break-words text-muted-foreground">
            {emphasizeQuoted(notification.message)}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-muted-foreground">{category}</Badge>
            <time dateTime={notification.createdAt} title={exactTime} className="tabular-nums sm:hidden">
              {time}
            </time>
          </div>
        </div>

        {/* Gesture alternatives. On touch screens they stay available to screen
            readers (and appear on keyboard focus); on wider screens they reveal
            on hover or focus. */}
        {!selecting && (
          <div
            className={cn(
              'relative z-10 shrink-0 items-center gap-0.5 self-center',
              'sr-only focus-within:not-sr-only focus-within:flex',
              'sm:not-sr-only sm:flex sm:opacity-0 sm:transition-opacity sm:duration-(--duration-fast) sm:group-hover:opacity-100 sm:focus-within:opacity-100',
            )}
          >
            {unread && <RowAction label="Mark as read" context={notification.title} icon={Check} onClick={() => onMarkRead(notification)} />}
            <RowAction label={archiveLabel} context={notification.title} icon={archived ? ArchiveRestore : Archive} onClick={() => onArchiveToggle(notification)} />
            <RowAction label="Delete" context={notification.title} icon={Trash2} tone="destructive" onClick={() => onDelete(notification)} />
          </div>
        )}
        {destination && !selecting && (
          <ChevronRight
            aria-hidden="true"
            className="pointer-events-none mt-3 hidden size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-fast) group-hover:translate-x-0.5 group-hover:text-foreground sm:block"
          />
        )}
      </div>
    </SwipeActions>
  );
}
