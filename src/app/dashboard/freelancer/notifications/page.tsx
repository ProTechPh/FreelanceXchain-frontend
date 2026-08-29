'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { notificationsApi } from '@/lib/api';
import { subscribeToNotificationStream } from '@/lib/sse';
import { getNotificationDestination } from '@/lib/notification-route';
import { useAuthStore } from '@/stores/authStore';
import type { Notification, NotificationType } from '@/types';
import { toast } from 'sonner';
import { FileText, DollarSign, MessageSquare, CheckCircle, XCircle, AlertTriangle, Clock, Star, RefreshCw, BellOff, type LucideIcon } from 'lucide-react';
import { ListSkeleton } from '@/components/dashboard/skeletons';

const ICON_BY_TYPE: Record<NotificationType, { icon: LucideIcon; color: string; bg: string }> = {
  proposal_received: { icon: FileText, color: 'text-info', bg: 'bg-info-subtle' },
  proposal_accepted: { icon: CheckCircle, color: 'text-success', bg: 'bg-success-subtle' },
  proposal_rejected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive-subtle' },
  milestone_submitted: { icon: FileText, color: 'text-info', bg: 'bg-info-subtle' },
  milestone_approved: { icon: CheckCircle, color: 'text-success', bg: 'bg-success-subtle' },
  milestone_rejected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive-subtle' },
  payment_released: { icon: DollarSign, color: 'text-success', bg: 'bg-success-subtle' },
  dispute_created: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning-subtle' },
  dispute_resolved: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning-subtle' },
  dispute_evidence_submitted: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning-subtle' },
  refund_requested: { icon: DollarSign, color: 'text-warning', bg: 'bg-warning-subtle' },
  refund_approved: { icon: DollarSign, color: 'text-success', bg: 'bg-success-subtle' },
  refund_rejected: { icon: DollarSign, color: 'text-destructive', bg: 'bg-destructive-subtle' },
  rating_received: { icon: Star, color: 'text-warning', bg: 'bg-warning-subtle' },
  rush_upgrade_requested: { icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
  rush_upgrade_accepted: { icon: CheckCircle, color: 'text-success', bg: 'bg-success-subtle' },
  rush_upgrade_declined: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive-subtle' },
  rush_upgrade_counter_offered: { icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
  message: { icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' },
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.round(diffMs / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffSec) < 60) return rtf.format(-diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, 'minute');
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(-diffHour, 'hour');
  const diffDay = Math.round(diffHour / 24);
  return rtf.format(-diffDay, 'day');
}

type Tab = 'all' | 'unread';

export function NotificationsCenter() {
  const role = useAuthStore((state) => state.user?.role);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [continuationToken, setContinuationToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState<Tab>('all');

  const loadFirstPage = useCallback(async () => {
    try {
      const { data } = await notificationsApi.list({ maxItemCount: 20 });
      setNotifications(data.items);
      setContinuationToken(data.continuationToken);
      setHasMore(data.hasMore);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFirstPage();
  }, [loadFirstPage]);

  useEffect(() => {
    const unsubscribe = subscribeToNotificationStream((notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });
    return unsubscribe;
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const { data } = await notificationsApi.list({ maxItemCount: 20, continuationToken });
      setNotifications((prev) => [...prev, ...data.items]);
      setContinuationToken(data.continuationToken);
      setHasMore(data.hasMore);
    } catch {
      toast.error('Failed to load more notifications');
    } finally {
      setLoadingMore(false);
    }
  };

  const markRead = async (id: string) => {
    const wasUnread = notifications.some((notification) => notification.id === id && !notification.isRead);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    if (wasUnread) window.dispatchEvent(new CustomEvent('notification-count-change', { detail: { delta: -1 } }));
    try {
      await notificationsApi.markRead(id);
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllRead = async () => {
    const previous = notifications;
    const previousUnreadCount = previous.filter((notification) => !notification.isRead).length;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    window.dispatchEvent(new CustomEvent('notification-count-change', { detail: { delta: -previousUnreadCount } }));
    try {
      await notificationsApi.markAllRead();
    } catch {
      setNotifications(previous);
      window.dispatchEvent(new CustomEvent('notification-count-change', { detail: { delta: previousUnreadCount } }));
      toast.error('Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const visible = tab === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  if (loading) {
    return (
      <ListSkeleton rows={6} label="Loading notifications" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on your activity</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCircle className="w-4 h-4 mr-2" /> Mark all read
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border pb-2">
        <Button
          variant="ghost"
          size="sm"
          className={tab === 'all' ? 'border-b-2 border-primary rounded-none' : 'text-muted-foreground'}
          onClick={() => setTab('all')}
        >
          All
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={tab === 'unread' ? 'border-b-2 border-primary rounded-none' : 'text-muted-foreground'}
          onClick={() => setTab('unread')}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
            <BellOff className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {tab === 'unread' ? "You're all caught up" : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((notification) => {
            const { icon: Icon, color, bg } = ICON_BY_TYPE[notification.type];
            const destination = role ? getNotificationDestination(notification, role) : null;
            const notificationContent = (
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}><Icon className={`w-5 h-5 ${color}`} /></div>
                <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className={`font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{notification.title}</p>{!notification.isRead && <div className="w-2 h-2 rounded-full bg-primary" />}</div><p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p><p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {relativeTime(notification.createdAt)}</p></div>
              </div>
            );
            return (
              <Card
                key={notification.id}
                className={`bg-card border-border transition-all hover:border-primary/20 ${
                  !notification.isRead ? 'border-l-2 border-l-primary' : ''
                }`}
              >
                <CardContent className="p-0">{destination ? <Link href={destination} className="block rounded-xl p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { if (!notification.isRead) void markRead(notification.id); }}>{notificationContent}</Link> : <button type="button" className="block w-full rounded-xl p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { if (!notification.isRead) void markRead(notification.id); }}>{notificationContent}</button>}</CardContent>
              </Card>
            );
          })}
          {hasMore && tab === 'all' && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={loadMore} loading={loadingMore} loadingText="Loading…">
                <RefreshCw className="size-4" aria-hidden="true" />
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FreelancerNotificationsPage() {
  return <NotificationsCenter />;
}
