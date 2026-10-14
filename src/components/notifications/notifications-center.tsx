'use client';

import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Archive, ArchiveRestore, BellOff, CheckCheck, FilterX, Hand, ListChecks, RefreshCw, Trash2, X } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { PageHeader } from '@/components/dashboard/page-header';
import { ListSkeleton } from '@/components/dashboard/skeletons';
import { NotificationRow, CATEGORY_ORDER, categoryOf, type Category } from '@/components/notifications/notification-row';
import { notificationsApi } from '@/lib/api';
import { subscribeToNotificationStream } from '@/lib/sse';
import { reportFailure, reportLoadFailure } from '@/lib/report-failure';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import type { Notification } from '@/types';

type Tab = 'all' | 'unread' | 'archived';
type View = Tab;
type ArchiveStatus = 'idle' | 'loading' | 'ready' | 'error';
type ServerAction = 'archive' | 'unarchive' | 'delete';

const PAGE_SIZE = 20;
/** How long a delete can be undone before it reaches the server. */
const UNDO_MS = 6000;
/** The bulk endpoint's per-request cap. */
const BULK_LIMIT = 100;

const GROUP_ORDER = ['Today', 'Yesterday', 'Earlier this week', 'Older'] as const;
type GroupLabel = (typeof GROUP_ORDER)[number];

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function groupLabelFor(iso: string | null | undefined, today: number): GroupLabel {
  const time = iso ? new Date(iso).getTime() : NaN;
  if (Number.isNaN(time)) return 'Older';
  const days = Math.round((today - startOfDay(new Date(time))) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return 'Earlier this week';
  return 'Older';
}

function groupByDay(items: Notification[]): Array<{ label: GroupLabel; items: Notification[] }> {
  const today = startOfDay(new Date());
  const buckets = new Map<GroupLabel, Notification[]>();
  for (const item of items) {
    const label = groupLabelFor(item.createdAt, today);
    const bucket = buckets.get(label);
    if (bucket) bucket.push(item);
    else buckets.set(label, [item]);
  }
  return GROUP_ORDER.filter((label) => buckets.has(label)).map((label) => ({ label, items: buckets.get(label)! }));
}

function withoutIds(list: Notification[], ids: Set<string>): Notification[] {
  return list.filter((notification) => !ids.has(notification.id));
}

/** Puts a notification back where it belongs (newest first), e.g. after an undo. */
function insertByDate(list: Notification[], item: Notification): Notification[] {
  const next = list.filter((notification) => notification.id !== item.id);
  const time = Date.parse(item.createdAt);
  const index = next.findIndex((notification) => Date.parse(notification.createdAt) < time);
  if (index === -1) next.push(item);
  else next.splice(index, 0, item);
  return next;
}

function insertAll(list: Notification[], items: Notification[]): Notification[] {
  return items.reduce(insertByDate, list);
}

function countUnread(items: Notification[]): number {
  return items.filter((notification) => !notification.isRead).length;
}

/** "Notification archived" / "3 notifications archived". */
function countLabel(count: number, verb: string): string {
  return count === 1 ? `Notification ${verb}` : `${count} notifications ${verb}`;
}

/** Keeps the TopBar bell in step; it holds its own counter. */
function shiftUnreadBadge(delta: number) {
  if (delta !== 0) window.dispatchEvent(new CustomEvent('notification-count-change', { detail: { delta } }));
}

/**
 * Sends one action for any number of ids and resolves with the ids that
 * failed. A single id uses its own endpoint; larger sets go through the bulk
 * endpoint in chunks it accepts. Rejects only when nothing could be sent.
 */
async function sendAction(action: ServerAction, ids: string[]): Promise<string[]> {
  if (ids.length === 1) {
    const [id] = ids as [string];
    if (action === 'archive') await notificationsApi.archive(id);
    else if (action === 'unarchive') await notificationsApi.unarchive(id);
    else await notificationsApi.remove(id);
    return [];
  }
  const failed: string[] = [];
  for (let start = 0; start < ids.length; start += BULK_LIMIT) {
    const chunk = ids.slice(start, start + BULK_LIMIT);
    try {
      const { data } = await notificationsApi.bulk(action, chunk);
      failed.push(...data.failed);
    } catch (error) {
      if (start === 0 && ids.length <= BULK_LIMIT) throw error;
      failed.push(...chunk);
    }
  }
  return failed;
}

function CountPill({ value, emphasis = false }: { value: number; emphasis?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums',
        emphasis ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
      )}
    >
      {value}
    </span>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap',
        'transition-colors duration-(--duration-fast) outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        active
          ? 'border-primary bg-primary-subtle text-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground active:bg-muted',
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn('tabular-nums', active ? 'text-primary' : 'text-muted-foreground')}>{count}</span>
      )}
    </button>
  );
}

export function NotificationsCenter() {
  const role = useAuthStore((state) => state.user?.role);
  const [inbox, setInbox] = useState<Notification[]>([]);
  const [inboxHasMore, setInboxHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [archived, setArchived] = useState<Notification[]>([]);
  const [archivedHasMore, setArchivedHasMore] = useState(false);
  const [archiveStatus, setArchiveStatus] = useState<ArchiveStatus>('idle');
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState<Tab>('all');
  const [category, setCategory] = useState<Category | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  // Every write goes through one queue, so an Undo can never overtake the
  // action it is undoing, whether either side was a swipe or a bulk action.
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  // Deletes wait out their undo window here; `pendingIds` keeps a refresh
  // from resurrecting rows that are about to be deleted.
  const pendingBatches = useRef(new Map<string, { timer: number; commit: () => void }>());
  const pendingIds = useRef(new Set<string>());

  const enqueue = useCallback(<T,>(run: () => Promise<T>): Promise<T> => {
    const next = queueRef.current.catch(() => undefined).then(run);
    queueRef.current = next;
    return next;
  }, []);

  const notPending = (notification: Notification) => !pendingIds.current.has(notification.id);

  const loadFirstPage = useCallback(async () => {
    const { data } = await notificationsApi.list({ maxItemCount: PAGE_SIZE });
    setInbox(data.items.filter((notification) => !pendingIds.current.has(notification.id)));
    setInboxHasMore(data.hasMore);
  }, []);

  const loadArchived = useCallback(async () => {
    setArchiveStatus('loading');
    try {
      const { data } = await notificationsApi.list({ maxItemCount: PAGE_SIZE, archived: true });
      setArchived(data.items.filter((notification) => !pendingIds.current.has(notification.id)));
      setArchivedHasMore(data.hasMore);
      setArchiveStatus('ready');
    } catch (error) {
      setArchiveStatus('error');
      reportFailure(error, 'load archived notifications');
    }
  }, []);

  // Reported here rather than inside the loader so the toast's Retry can
  // call it again; a self-reference inside the callback is not allowed.
  useEffect(() => {
    let active = true;
    function run() {
      loadFirstPage()
        .catch((error) => {
          if (active) reportLoadFailure(error, 'notifications', run);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    run();
    return () => {
      active = false;
    };
  }, [loadFirstPage]);

  useEffect(() => {
    const unsubscribe = subscribeToNotificationStream((notification) => {
      setInbox((prev) => [notification, ...prev.filter((item) => item.id !== notification.id)]);
    });
    return unsubscribe;
  }, []);

  // Leaving the page must not silently cancel deletes still inside their undo window.
  useEffect(() => {
    const batches = pendingBatches.current;
    return () => {
      for (const { timer, commit } of batches.values()) {
        window.clearTimeout(timer);
        commit();
      }
    };
  }, []);

  const exitSelection = useCallback(() => {
    setSelecting(false);
    setSelected(new Set());
  }, []);

  useEffect(() => {
    if (!selecting) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') exitSelection();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selecting, exitSelection]);

  const handleTabChange = (value: Tab) => {
    setTab(value);
    setSelected(new Set());
    if (value === 'archived' && (archiveStatus === 'idle' || archiveStatus === 'error')) void loadArchived();
  };

  const refresh = () => (tab === 'archived' ? loadArchived() : loadFirstPage());

  const loadMore = async (view: View) => {
    const isArchive = view === 'archived';
    const list = isArchive ? archived : inbox;
    setLoadingMore(true);
    try {
      const { data } = await notificationsApi.list({
        maxItemCount: PAGE_SIZE,
        continuationToken: list[list.length - 1]?.id,
        ...(isArchive ? { archived: true } : {}),
      });
      const append = (prev: Notification[]) => {
        const known = new Set(prev.map((notification) => notification.id));
        return [...prev, ...data.items.filter((notification) => !known.has(notification.id) && notPending(notification))];
      };
      if (isArchive) {
        setArchived(append);
        setArchivedHasMore(data.hasMore);
      } else {
        setInbox(append);
        setInboxHasMore(data.hasMore);
      }
    } catch (error) {
      reportFailure(error, 'load more notifications');
    } finally {
      setLoadingMore(false);
    }
  };

  const markRead = (notification: Notification) => {
    if (notification.isRead) return;
    const inInbox = inbox.some((item) => item.id === notification.id);
    const patch = (list: Notification[]) =>
      list.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item));
    setInbox(patch);
    setArchived(patch);
    if (inInbox) shiftUnreadBadge(-1);
    // Best-effort optimistic mark as read
    enqueue(() => notificationsApi.markRead(notification.id)).catch(() => undefined);
  };

  const markAllRead = async () => {
    const previous = inbox;
    const previousUnreadCount = countUnread(previous);
    setInbox((prev) => prev.map((n) => ({ ...n, isRead: true })));
    shiftUnreadBadge(-previousUnreadCount);
    try {
      await notificationsApi.markAllRead();
    } catch {
      setInbox(previous);
      shiftUnreadBadge(previousUnreadCount);
      toast.error('Couldn\'t mark your notifications as read. Try again.');
    }
  };

  function archiveMany(items: Notification[]) {
    if (items.length === 0) return;
    const ids = new Set(items.map((notification) => notification.id));
    const filed = items.map((notification) => ({ ...notification, isArchived: true }));
    setInbox((prev) => withoutIds(prev, ids));
    setArchived((prev) => insertAll(prev, filed));
    shiftUnreadBadge(-countUnread(items));

    const revert = (failedIds: Set<string>) => {
      const back = items.filter((notification) => failedIds.has(notification.id));
      if (back.length === 0) return;
      setArchived((prev) => withoutIds(prev, failedIds));
      setInbox((prev) => insertAll(prev, back));
      shiftUnreadBadge(countUnread(back));
      toast.error(
        back.length === 1
          ? 'Couldn\'t archive that notification. It\'s back in your inbox.'
          : `Couldn't archive ${back.length} notifications. They're back in your inbox.`,
      );
    };
    enqueue(() => sendAction('archive', [...ids])).then(
      (failed) => revert(new Set(failed)),
      () => revert(ids),
    );

    toast(countLabel(items.length, 'archived'), {
      icon: <Archive className="size-4 text-neutral" aria-hidden="true" />,
      duration: UNDO_MS,
      action: { label: 'Undo', onClick: () => restoreMany(filed, { quiet: true }) },
    });
  }

  function restoreMany(items: Notification[], { quiet = false } = {}) {
    if (items.length === 0) return;
    const ids = new Set(items.map((notification) => notification.id));
    const restored = items.map((notification) => ({ ...notification, isArchived: false }));
    setArchived((prev) => withoutIds(prev, ids));
    setInbox((prev) => insertAll(prev, restored));
    shiftUnreadBadge(countUnread(items));

    const revert = (failedIds: Set<string>) => {
      const back = items.filter((notification) => failedIds.has(notification.id));
      if (back.length === 0) return;
      setInbox((prev) => withoutIds(prev, failedIds));
      setArchived((prev) => insertAll(prev, back));
      shiftUnreadBadge(-countUnread(back));
      toast.error(
        back.length === 1
          ? 'Couldn\'t restore that notification. Try again.'
          : `Couldn't restore ${back.length} notifications. Try again.`,
      );
    };
    enqueue(() => sendAction('unarchive', [...ids])).then(
      (failed) => revert(new Set(failed)),
      () => revert(ids),
    );

    if (!quiet) {
      toast(items.length === 1 ? 'Moved back to your inbox' : `${items.length} notifications moved back to your inbox`, {
        icon: <ArchiveRestore className="size-4 text-neutral" aria-hidden="true" />,
        duration: UNDO_MS,
        action: { label: 'Undo', onClick: () => archiveMany(restored) },
      });
    }
  }

  function deleteMany(items: Notification[], view: View) {
    if (items.length === 0) return;
    const ids = items.map((notification) => notification.id);
    const idSet = new Set(ids);
    const fromInbox = view !== 'archived';
    const setList = fromInbox ? setInbox : setArchived;
    // Archived notifications are already out of the unread total.
    const badgeDelta = fromInbox ? countUnread(items) : 0;

    setList((prev) => withoutIds(prev, idSet));
    shiftUnreadBadge(-badgeDelta);
    ids.forEach((id) => pendingIds.current.add(id));

    const putBack = (subset: Notification[]) => {
      setList((prev) => insertAll(prev, subset));
      if (fromInbox) shiftUnreadBadge(countUnread(subset));
    };
    // Unique while pending: these rows leave the list until committed or undone.
    const key = ids.join(',');
    const release = () => {
      pendingBatches.current.delete(key);
      ids.forEach((id) => pendingIds.current.delete(id));
    };

    // The delete is only sent once the undo window closes, so Undo is a pure
    // client-side put-back and a mistaken swipe never touches the server.
    const commit = () => {
      release();
      enqueue(() => sendAction('delete', ids)).then(
        (failed) => {
          if (failed.length === 0) return;
          const failedSet = new Set(failed);
          putBack(items.filter((notification) => failedSet.has(notification.id)));
          toast.error(`Couldn't delete ${failed.length === 1 ? 'that notification' : `${failed.length} notifications`}. ${failed.length === 1 ? 'It\'s' : 'They\'re'} back in your list.`);
        },
        () => {
          putBack(items);
          toast.error(`Couldn't delete ${items.length === 1 ? 'that notification' : 'those notifications'}. Check your connection and try again.`);
        },
      );
    };
    const timer = window.setTimeout(commit, UNDO_MS);
    pendingBatches.current.set(key, { timer, commit });

    toast(countLabel(items.length, 'deleted'), {
      icon: <Trash2 className="size-4 text-destructive" aria-hidden="true" />,
      duration: UNDO_MS,
      action: {
        label: 'Undo',
        onClick: () => {
          const pending = pendingBatches.current.get(key);
          if (!pending) return;
          window.clearTimeout(pending.timer);
          release();
          putBack(items);
        },
      },
    });
  }

  const unread = useMemo(() => inbox.filter((n) => !n.isRead), [inbox]);
  const unreadCount = unread.length;

  const tabSource = tab === 'archived' ? archived : tab === 'unread' ? unread : inbox;

  // Chips only list categories that actually occur in the current tab, so a
  // filter can never lead to a guaranteed-empty list.
  const categoryCounts = useMemo(() => {
    const counts = new Map<Category, number>();
    for (const notification of tabSource) {
      const key = categoryOf(notification);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return CATEGORY_ORDER.filter((key) => counts.has(key)).map((key) => ({ key, count: counts.get(key)! }));
  }, [tabSource]);

  const activeCategory = category && categoryCounts.some((entry) => entry.key === category) ? category : null;
  const applyCategory = (items: Notification[]) =>
    activeCategory ? items.filter((notification) => categoryOf(notification) === activeCategory) : items;

  // Bulk actions only ever touch what is on screen: switching tab or filter
  // never leaves hidden rows quietly selected.
  const visible = applyCategory(tabSource);
  const selectedVisible = visible.filter((notification) => selected.has(notification.id));
  const allVisibleSelected = visible.length > 0 && selectedVisible.length === visible.length;

  const toggleSelected = (notification: Notification) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(notification.id)) next.delete(notification.id);
      else next.add(notification.id);
      return next;
    });
  };

  const setManySelected = (items: Notification[], on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const notification of items) {
        if (on) next.add(notification.id);
        else next.delete(notification.id);
      }
      return next;
    });
  };

  const startSelecting = (initial?: Notification) => {
    setSelecting(true);
    setSelected(new Set(initial ? [initial.id] : []));
  };

  const runBulk = (kind: 'archive' | 'delete') => {
    const items = selectedVisible;
    if (items.length === 0) return;
    if (kind === 'delete') deleteMany(items, tab);
    else if (tab === 'archived') restoreMany(items);
    else archiveMany(items);
    exitSelection();
  };

  const header = (
    <PageHeader
      title="Notifications"
      description="Updates on your proposals, milestones, payments, and disputes."
      actions={
        <Button variant="outline" size="sm" onClick={markAllRead} disabled={loading || unreadCount === 0}>
          <CheckCheck className="size-4" aria-hidden="true" />
          Mark all read
        </Button>
      }
    />
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <ListSkeleton rows={6} label="Loading notifications" />
      </div>
    );
  }

  const renderEmpty = (view: View) => {
    if (activeCategory) {
      return (
        <EmptyState
          icon={FilterX}
          title={`No ${activeCategory.toLowerCase()} notifications here`}
          description="Try another category or clear the filter."
          action={<Button variant="outline" size="sm" onClick={() => setCategory(null)}>Clear filter</Button>}
        />
      );
    }
    if (view === 'archived') {
      return (
        <EmptyState
          icon={Archive}
          title="Nothing archived"
          description="Swipe a notification left, or use its archive button, to file it here. Archived notifications don't count toward your unread total."
        />
      );
    }
    if (view === 'unread') {
      return (
        <EmptyState
          icon={CheckCheck}
          title="You're all caught up"
          description="New activity on your projects will show up here as it happens."
          action={inbox.length > 0 ? (
            <Button variant="outline" size="sm" onClick={() => handleTabChange('all')}>View all notifications</Button>
          ) : undefined}
        />
      );
    }
    return (
      <EmptyState
        icon={BellOff}
        title="No notifications yet"
        description="Proposals, milestone reviews, payments, and dispute updates will appear here."
      />
    );
  };

  const renderList = (items: Notification[], view: View) => {
    if (items.length === 0) return renderEmpty(view);

    const hasMore = view === 'all' ? inboxHasMore : view === 'archived' ? archivedHasMore : false;
    let rowIndex = 0;
    return (
      <div className="space-y-6">
        {groupByDay(items).map((group) => {
          const headingId = `notifications-${view}-${group.label.toLowerCase().replace(/\s+/g, '-')}`;
          const groupUnread = countUnread(group.items);
          const groupSelected = group.items.filter((notification) => selected.has(notification.id)).length;
          return (
            <section key={group.label} aria-labelledby={headingId} className="space-y-2.5">
              <div className="flex items-center gap-3 px-1">
                {selecting && (
                  <Checkbox
                    checked={groupSelected === group.items.length}
                    indeterminate={groupSelected > 0 && groupSelected < group.items.length}
                    onCheckedChange={(checked) => setManySelected(group.items, checked)}
                    aria-label={`Select all from ${group.label.toLowerCase()}`}
                  />
                )}
                <h2 id={headingId} className="text-sm font-semibold text-foreground">{group.label}</h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {group.items.length}
                  {view === 'all' && groupUnread > 0 && <span className="text-primary"> · {groupUnread} new</span>}
                </span>
                <span aria-hidden="true" className="h-px flex-1 bg-border" />
              </div>
              <Card className="gap-0 py-0 shadow-xs">
                <ul className="divide-y divide-border">
                  {group.items.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      role={role}
                      index={rowIndex++}
                      archived={view === 'archived'}
                      onOpen={markRead}
                      onMarkRead={markRead}
                      onArchiveToggle={(n) => (view === 'archived' ? restoreMany([n]) : archiveMany([n]))}
                      onDelete={(n) => deleteMany([n], view)}
                      selecting={selecting}
                      selected={selected.has(notification.id)}
                      onToggleSelect={toggleSelected}
                      onLongPress={selecting ? undefined : startSelecting}
                    />
                  ))}
                </ul>
              </Card>
            </section>
          );
        })}
        {hasMore && (
          <div className="flex flex-col items-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => void loadMore(view)} loading={loadingMore} loadingText="Loading…">
              <RefreshCw className="size-4" aria-hidden="true" />
              Load older notifications
            </Button>
            {activeCategory && (
              <p className="text-xs text-muted-foreground">Older {activeCategory.toLowerCase()} updates may be on the next page.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderArchived = () => {
    if (archiveStatus === 'idle' || archiveStatus === 'loading') {
      return <ListSkeleton rows={4} label="Loading archived notifications" />;
    }
    if (archiveStatus === 'error') {
      return (
        <EmptyState
          icon={Archive}
          title="Couldn't load your archive"
          description="Your archived notifications are safe. Check your connection and try again."
          action={<Button variant="outline" size="sm" onClick={() => void loadArchived()}>Retry</Button>}
        />
      );
    }
    return renderList(applyCategory(archived), 'archived');
  };

  const count = selectedVisible.length;
  const archiveVerb = tab === 'archived' ? 'Restore' : 'Archive';
  const ArchiveVerbIcon = tab === 'archived' ? ArchiveRestore : Archive;

  const selectionBar = (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className="animate-element flex min-h-11 items-center gap-2 rounded-xl border border-primary/30 bg-primary-subtle/70 py-1.5 pr-1.5 pl-3 sm:gap-3"
    >
      <Checkbox
        checked={allVisibleSelected}
        indeterminate={count > 0 && !allVisibleSelected}
        onCheckedChange={(checked) => setManySelected(visible, checked)}
        aria-label={allVisibleSelected ? 'Clear selection' : `Select all ${visible.length} shown`}
        className="size-5"
      />
      <span className="min-w-0 truncate text-sm font-semibold text-foreground tabular-nums" aria-live="polite">
        {count === 0 ? 'Select notifications' : `${count} selected`}
      </span>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={count === 0}
          onClick={() => runBulk('archive')}
          aria-label={`${archiveVerb} ${count} selected`}
          className="bg-card hover:border-neutral hover:bg-neutral-subtle hover:text-foreground"
        >
          <ArchiveVerbIcon className="size-4 text-neutral" aria-hidden="true" />
          <span className="hidden sm:inline">{archiveVerb}</span>
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={count === 0}
          onClick={() => runBulk('delete')}
          aria-label={`Delete ${count} selected`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={exitSelection} aria-label="Exit selection">
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {header}

      <Tabs value={tab} onValueChange={(value) => handleTabChange(value as Tab)} className="gap-5">
        {/* Stays reachable while scrolling a long list; offset matches the TopBar height. */}
        <div className="sticky top-14 z-30 -mx-4 space-y-3 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl sm:top-16 sm:-mx-6 sm:px-6 lg:-mx-(--space-page-x) lg:px-(--space-page-x)">
          <div className={cn('flex items-center gap-2', selecting && 'hidden')}>
            <TabsList className="flex-1 sm:flex-none">
              <TabsTrigger value="all" className="gap-2 px-3 sm:flex-none">
                All
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                role="button"
                aria-label={`Unread (${unreadCount})`}
                className="gap-2 px-3 sm:flex-none"
              >
                Unread
                <CountPill value={unreadCount} emphasis={unreadCount > 0} />
              </TabsTrigger>
              <TabsTrigger value="archived" className="gap-2 px-3 sm:flex-none">
                <Archive className="size-4" aria-hidden="true" />
                Archived
              </TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              onClick={() => startSelecting()}
              disabled={visible.length === 0}
              aria-label="Select notifications"
              className="ml-auto shrink-0"
            >
              <ListChecks className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Select</span>
            </Button>
          </div>

          {selecting && selectionBar}

          {categoryCounts.length > 1 && (
            <div
              role="group"
              aria-label="Filter by category"
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
            >
              <FilterChip active={activeCategory === null} onClick={() => setCategory(null)}>
                All types
              </FilterChip>
              {categoryCounts.map(({ key, count: chipCount }) => (
                <FilterChip
                  key={key}
                  active={activeCategory === key}
                  count={chipCount}
                  onClick={() => setCategory(activeCategory === key ? null : key)}
                >
                  {key}
                </FilterChip>
              ))}
            </div>
          )}

          {/* Touch screens only: the gestures are invisible until someone tells you they exist. */}
          {!selecting && (
            <p className="hidden items-center gap-1.5 text-xs text-muted-foreground pointer-coarse:flex">
              <Hand className="size-3.5" aria-hidden="true" />
              {tab === 'archived'
                ? 'Swipe left to restore, right to delete. Press and hold to select.'
                : 'Swipe left to archive, right to delete. Press and hold to select.'}
            </p>
          )}
        </div>

        <PullToRefresh onRefresh={refresh} disabled={selecting}>
          <TabsContent value="all">{renderList(applyCategory(inbox), 'all')}</TabsContent>
          <TabsContent value="unread">{renderList(applyCategory(unread), 'unread')}</TabsContent>
          <TabsContent value="archived">{renderArchived()}</TabsContent>
        </PullToRefresh>
      </Tabs>
    </div>
  );
}
