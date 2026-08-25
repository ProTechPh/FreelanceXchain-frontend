'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { adminApi, auditLogsApi, kycApi } from '@/lib/api';
import type { AuditLogEntry, Dispute, SystemHealth } from '@/types';
import { toast } from 'sonner';
import { Users, FolderOpen, DollarSign, AlertTriangle, Activity, ArrowUpRight, Shield, BarChart3, CheckCircle, Clock, Loader2 } from 'lucide-react';

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

function describeLog(log: AuditLogEntry): string {
  const action = log.action.replace(/_/g, ' ');
  return `${action.charAt(0).toUpperCase()}${action.slice(1)} — ${log.resource_type}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeProjects: number;
    totalTransactionVolume: number;
  } | null>(null);
  const [openDisputes, setOpenDisputes] = useState<Dispute[]>([]);
  const [pendingKycCount, setPendingKycCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);

  const load = useCallback(async () => {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [statsRes, disputesRes, kycRes, activityRes, healthRes] = await Promise.allSettled([
        adminApi.getStats(),
        adminApi.getDisputeManagement('open'),
        kycApi.adminGetPending(),
        auditLogsApi.getByDateRange(yesterday.toISOString(), now.toISOString()),
        adminApi.getSystemHealth(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (disputesRes.status === 'fulfilled') setOpenDisputes(disputesRes.value.data.disputes);
      if (kycRes.status === 'fulfilled') setPendingKycCount(kycRes.value.data.length);
      if (activityRes.status === 'fulfilled') {
        const sorted = activityRes.value.data.logs
          .slice()
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        setRecentActivity(sorted);
      }
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statTiles = [
    {
      title: 'Total Users',
      value: stats ? stats.totalUsers.toLocaleString() : '—',
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Active Projects',
      value: stats ? stats.activeProjects.toLocaleString() : '—',
      icon: FolderOpen,
      color: 'text-cyan',
      bg: 'bg-cyan/10',
    },
    {
      title: 'Total Transaction Volume',
      value: stats ? `$${stats.totalTransactionVolume.toLocaleString()}` : '—',
      icon: DollarSign,
      color: 'text-success',
      bg: 'bg-success-subtle',
    },
    {
      title: 'Open Disputes',
      value: String(openDisputes.length),
      icon: AlertTriangle,
      color: 'text-warning',
      bg: 'bg-warning-subtle',
    },
  ];

  const pendingActions = [
    {
      id: 'disputes',
      title: 'Dispute Resolution',
      description: `${openDisputes.length} disputes awaiting admin review`,
      count: openDisputes.length,
      link: '/dashboard/admin/disputes',
    },
    {
      id: 'kyc',
      title: 'KYC Verifications',
      description: `${pendingKycCount} pending identity verifications`,
      count: pendingKycCount,
      link: '/dashboard/admin/kyc',
    },
  ].filter((action) => action.count > 0);

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
        {statTiles.map((stat) => (
          <Card key={stat.title} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
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
            {pendingActions.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">Nothing pending — all clear</p>
            )}
            {pendingActions.map((action) => (
              <Link key={action.id} href={action.link}>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/20 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{action.title}</p>
                    <Badge className="bg-warning-subtle text-warning">{action.count}</Badge>
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
            <Link href="/dashboard/admin/audit-logs">
              <Button variant="ghost" size="sm">
                View All <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">No activity in the last 24 hours</p>
            )}
            {recentActivity.map((log) => {
              const Icon = log.status === 'failure' ? AlertTriangle : log.status === 'pending' ? Clock : CheckCircle;
              const color = log.status === 'failure' ? 'text-destructive' : log.status === 'pending' ? 'text-warning' : 'text-success';
              return (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                  <div className={`w-8 h-8 rounded-lg bg-background flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{describeLog(log)}</p>
                    <p className="text-xs text-muted-foreground">{relativeTime(log.created_at)}</p>
                  </div>
                </div>
              );
            })}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Database (Appwrite)', status: health?.database },
              { name: 'Storage (Appwrite)', status: health?.storage },
              { name: 'Process Uptime', value: health ? formatUptime(health.uptime) : undefined },
            ].map((item) => (
              <div key={item.name} className="p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  {item.status && (
                    <div className={`w-2 h-2 rounded-full ${item.status === 'healthy' ? 'bg-success' : 'bg-destructive'}`} />
                  )}
                  <p className="text-sm text-muted-foreground">{item.name}</p>
                </div>
                <p className="font-semibold capitalize">{item.value ?? item.status ?? '—'}</p>
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
              <div className="w-10 h-10 rounded-lg bg-warning-subtle flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
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
              <div className="w-10 h-10 rounded-lg bg-success-subtle flex items-center justify-center">
                <Shield className="w-5 h-5 text-success" />
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
