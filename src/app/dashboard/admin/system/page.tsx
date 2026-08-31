'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api';
import type { SystemHealth } from '@/types';
import { reportLoadFailure } from '@/lib/report-failure';
import { Database, HardDrive, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { StatsSkeleton } from '@/components/dashboard/skeletons';

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // A ref, because the Retry handed to the toast has to re-enter `load` with the
  // same arguments, and a callback cannot reference itself.
  const loadRef = useRef<(isRefresh?: boolean) => void>(() => {});

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await adminApi.getSystemHealth();
      setHealth(data);
    } catch (error) {
      reportLoadFailure(error, 'system health', () => loadRef.current(isRefresh));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRef.current = (isRefresh) => void load(isRefresh);
  }, [load]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (loading) {
    return (
      <StatsSkeleton label="Loading system health" />
    );
  }

  const allHealthy = health?.database === 'healthy' && health?.storage === 'healthy';

  const cards = [
    {
      name: 'Database (Appwrite)',
      status: health?.database,
      icon: Database,
    },
    {
      name: 'Storage (Appwrite)',
      status: health?.storage,
      icon: HardDrive,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">System health</h1>
          <p className="text-muted-foreground">
            Real backend health signals — this backend exposes database and storage
            connectivity plus process uptime, not per-service response-time metrics.
          </p>
        </div>
        <Button variant="outline" onClick={() => load(true)} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl ${allHealthy ? 'bg-success-subtle' : 'bg-destructive-subtle'} flex items-center justify-center`}>
              {allHealthy ? (
                <CheckCircle className="w-8 h-8 text-success" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-destructive" />
              )}
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${allHealthy ? 'text-success' : 'text-destructive'}`}>
                {allHealthy ? 'All Systems Operational' : 'Degraded'}
              </h2>
              <p className="text-muted-foreground">
                {health && `Last checked ${new Date(health.timestamp).toLocaleString()}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health signals */}
      <div className="grid md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.name} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      card.status === 'healthy' ? 'bg-success-subtle' : 'bg-destructive-subtle'
                    }`}
                  >
                    <card.icon className={`w-5 h-5 ${card.status === 'healthy' ? 'text-success' : 'text-destructive'}`} />
                  </div>
                  <p className="font-medium">{card.name}</p>
                </div>
                <Badge className={card.status === 'healthy' ? 'bg-success-subtle text-success' : 'bg-destructive-subtle text-destructive'}>
                  {card.status ?? 'unknown'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <p className="font-medium">Process Uptime</p>
            </div>
            <p className="text-lg font-semibold">{health ? formatUptime(health.uptime) : '—'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
