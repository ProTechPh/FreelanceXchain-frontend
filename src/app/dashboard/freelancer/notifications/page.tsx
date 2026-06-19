'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  DollarSign,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Clock,
  Star,
  Settings,
} from 'lucide-react';

const notifications = [
  {
    id: '1',
    type: 'proposal_viewed',
    title: 'Your proposal was viewed',
    message: 'TechCorp Inc. viewed your proposal for E-commerce Platform Redesign',
    timestamp: '5 min ago',
    read: false,
    icon: FileText,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    id: '2',
    type: 'milestone_approved',
    title: 'Milestone approved!',
    message: 'Your "UI Components" milestone for E-commerce Platform Redesign was approved',
    timestamp: '1 hour ago',
    read: false,
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    id: '3',
    type: 'payment_received',
    title: 'Payment received',
    message: 'You received $800 for the UI Components milestone',
    timestamp: '2 hours ago',
    read: false,
    icon: DollarSign,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    id: '4',
    type: 'new_message',
    title: 'New message from StartupXYZ',
    message: 'Can we schedule a call to discuss the API integration?',
    timestamp: '3 hours ago',
    read: true,
    icon: MessageSquare,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    id: '5',
    type: 'proposal_accepted',
    title: 'Proposal accepted!',
    message: 'Your proposal for Mobile App Development was accepted by StartupXYZ',
    timestamp: '1 day ago',
    read: true,
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    id: '6',
    type: 'dispute_update',
    title: 'Dispute update',
    message: 'A dispute has been resolved for Smart Contract Audit project',
    timestamp: '2 days ago',
    read: true,
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  {
    id: '7',
    type: 'review_received',
    title: 'New review received',
    message: 'DeFi Protocol left you a 5-star review',
    timestamp: '3 days ago',
    read: true,
    icon: Star,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  {
    id: '8',
    type: 'kyc_approved',
    title: 'KYC verified',
    message: 'Your identity verification has been approved',
    timestamp: '5 days ago',
    read: true,
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on your activity</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <CheckCircle className="w-4 h-4 mr-2" /> Mark all read
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Notification Tabs */}
      <div className="flex gap-4 border-b border-border pb-2">
        <Button variant="ghost" size="sm" className="border-b-2 border-primary rounded-none">
          All
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Unread (3)
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Proposals
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Contracts
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Payments
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {notifications.map((notification) => {
          const Icon = notification.icon;
          return (
            <Card
              key={notification.id}
              className={`bg-card border-border cursor-pointer transition-all hover:border-primary/20 ${
                !notification.read ? 'border-l-2 border-l-primary' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg ${notification.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${notification.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {notification.timestamp}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
