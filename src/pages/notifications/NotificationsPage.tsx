import { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle,
  FileText,
  DollarSign,
  AlertTriangle,
  Check,
  MessageSquare
} from 'lucide-react';
import { Card, PageLoader, Button } from '../../components/ui';
import api from '../../lib/api';
import type { Notification, NotificationType } from '../../types';
import { formatDistanceToNow } from 'date-fns';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await api.getNotifications();
        setNotifications(data.items);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => !n.isRead);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'proposal_received':
      case 'proposal_accepted':
      case 'proposal_rejected':
        return <FileText className="w-5 h-5 text-purple-400" />;
      case 'milestone_submitted':
      case 'milestone_approved':
        return <CheckCircle className="w-5 h-5 text-yellow-400" />;
      case 'payment_released':
        return <DollarSign className="w-5 h-5 text-green-400" />;
      case 'dispute_created':
      case 'dispute_resolved':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'rating_received':
        return <CheckCircle className="w-5 h-5 text-primary-400" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNotificationBgColor = (type: NotificationType) => {
    switch (type) {
      case 'proposal_received':
      case 'proposal_accepted':
      case 'proposal_rejected':
        return 'bg-purple-600/20';
      case 'milestone_submitted':
      case 'milestone_approved':
        return 'bg-yellow-600/20';
      case 'payment_released':
        return 'bg-green-600/20';
      case 'dispute_created':
      case 'dispute_resolved':
        return 'bg-red-600/20';
      case 'rating_received':
        return 'bg-primary-600/20';
      case 'message':
        return 'bg-blue-600/20';
      default:
        return 'bg-gray-600/20';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-gray-400 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <Check className="w-4 h-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-dark-surface text-gray-400 hover:text-white hover:bg-dark-border'
            }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'unread'
              ? 'bg-primary-600 text-white'
              : 'bg-dark-surface text-gray-400 hover:text-white hover:bg-dark-border'
            }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card className="text-center py-12">
          <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400">No notifications</h3>
          <p className="text-gray-500 mt-2">
            {filter === 'unread'
              ? "You've read all your notifications."
              : "You don't have any notifications yet."}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`hover:border-primary-500/50 transition-colors ${!notification.isRead ? 'border-l-4 border-l-primary-500' : ''
                }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${getNotificationBgColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-medium ${notification.isRead ? 'text-gray-400' : 'text-white'}`}>
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-primary-500 rounded-full" />
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mb-2">{notification.message}</p>
                  <p className="text-xs text-gray-600">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-2 text-gray-400 hover:text-primary-400 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
