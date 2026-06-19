'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Users,
  FolderOpen,
  DollarSign,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  Shield,
  BarChart3,
} from 'lucide-react';

const stats = [
  {
    title: 'Total Users',
    value: '12,450',
    change: '+245 this month',
    icon: Users,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    title: 'Active Projects',
    value: '1,280',
    change: '+120 this week',
    icon: FolderOpen,
    color: 'text-cyan',
    bg: 'bg-cyan/10',
  },
  {
    title: 'Total Revenue',
    value: '$245,000',
    change: '+$32,000 this month',
    icon: DollarSign,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    title: 'Open Disputes',
    value: '8',
    change: '3 urgent',
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
];

const recentActivity = [
  {
    id: '1',
    type: 'user_registered',
    message: 'New freelancer registered: Alex Thompson',
    timestamp: '5 min ago',
    icon: Users,
    color: 'text-primary',
  },
  {
    id: '2',
    type: 'project_created',
    message: 'New project posted: Web3 Social Media Platform',
    timestamp: '15 min ago',
    icon: FolderOpen,
    color: 'text-cyan',
  },
  {
    id: '3',
    type: 'payment_completed',
    message: 'Escrow payment released: $3,200',
    timestamp: '1 hour ago',
    icon: DollarSign,
    color: 'text-green-500',
  },
  {
    id: '4',
    type: 'dispute_opened',
    message: 'New dispute opened for Smart Contract Audit',
    timestamp: '2 hours ago',
    icon: AlertTriangle,
    color: 'text-yellow-500',
  },
  {
    id: '5',
    type: 'kyc_completed',
    message: 'KYC verification completed: Sarah Chen',
    timestamp: '3 hours ago',
    icon: Shield,
    color: 'text-green-500',
  },
];

const pendingActions = [
  {
    id: '1',
    title: 'Dispute Resolution',
    description: '3 disputes awaiting admin review',
    count: 3,
    urgency: 'high',
    link: '/dashboard/admin/disputes',
  },
  {
    id: '2',
    title: 'KYC Verifications',
    description: '5 pending identity verifications',
    count: 5,
    urgency: 'medium',
    link: '/dashboard/admin/kyc',
  },
  {
    id: '3',
    title: 'User Reports',
    description: '2 user reports requiring attention',
    count: 2,
    urgency: 'medium',
    link: '/dashboard/admin/users',
  },
];

const platformHealth = [
  { name: 'API Response Time', value: '45ms', status: 'healthy' },
  { name: 'Database', value: 'Connected', status: 'healthy' },
  { name: 'Blockchain Node', value: 'Synced', status: 'healthy' },
  { name: 'File Storage', value: '98% Available', status: 'healthy' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform overview and management</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/admin/analytics">
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </Button>
          </Link>
          <Link href="/dashboard/admin/system">
            <Button variant="outline">
              <Activity className="w-4 h-4 mr-2" /> System Health
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending Actions */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingActions.map((action) => (
              <Link key={action.id} href={action.link}>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/20 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{action.title}</p>
                    <Badge
                      className={
                        action.urgency === 'high'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-yellow-500/10 text-yellow-500'
                      }
                    >
                      {action.count}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm">
              View All <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border"
              >
                <div className={`w-8 h-8 rounded-lg bg-background flex items-center justify-center ${activity.color}`}>
                  <activity.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Platform Health */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" /> Platform Health
          </CardTitle>
          <Link href="/dashboard/admin/system">
            <Button variant="ghost" size="sm">
              Details <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {platformHealth.map((item) => (
              <div
                key={item.name}
                className="p-4 rounded-xl bg-secondary/50 border border-border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <p className="text-sm text-muted-foreground">{item.name}</p>
                </div>
                <p className="font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid md:grid-cols-4 gap-4">
        <Link href="/dashboard/admin/users">
          <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Manage Users</p>
                <p className="text-xs text-muted-foreground">View & moderate users</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/admin/disputes">
          <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="font-medium">Disputes</p>
                <p className="text-xs text-muted-foreground">Resolve conflicts</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/admin/analytics">
          <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-cyan" />
              </div>
              <div>
                <p className="font-medium">Analytics</p>
                <p className="text-xs text-muted-foreground">Platform insights</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/admin/kyc">
          <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">KYC Review</p>
                <p className="text-xs text-muted-foreground">Verify identities</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
