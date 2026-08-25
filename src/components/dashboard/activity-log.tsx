'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { History, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { auditLogsApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import type { AuditLogEntry } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ListSkeleton } from '@/components/dashboard/skeletons';
import { EmptyState } from '@/components/ui/empty-state';

function actionLabel(action: string): string {
  return action.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ActivityLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | AuditLogEntry['status']>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await auditLogsApi.getMine(100);
      setLogs(data.logs);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to load account activity.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesStatus = status === 'all' || log.status === status;
      const matchesQuery = !normalizedQuery || `${log.action} ${log.resource_type}`.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [logs, query, status]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><History className="size-6" />Activity log</h1><p className="text-muted-foreground">Review account, security, and marketplace actions recorded by the platform.</p></div><Button type="button" variant="outline" disabled={loading} onClick={() => void load()}><RefreshCw className="mr-2 size-4" />Refresh</Button></div>
      <Card><CardContent className="grid gap-4 p-4 sm:grid-cols-[1fr_220px]"><div className="space-y-2"><Label htmlFor="activity-search">Search activity</Label><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="activity-search" className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div><div className="space-y-2"><Label htmlFor="activity-status">Status</Label><select id="activity-status" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">All statuses</option><option value="success">Success</option><option value="failure">Failure</option><option value="pending">Pending</option></select></div></CardContent></Card>
      {loading ? <ListSkeleton rows={5} label="Loading activity" /> : filtered.length === 0 ? <EmptyState
          icon={History}
          title="No activity matches these filters"
          description="Try clearing the search or widening the date range."
        /> : <Card><CardContent className="p-0"><ul className="divide-y divide-border">{filtered.map((log) => <li key={log.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{actionLabel(log.action)}</p><p className="mt-1 text-sm text-muted-foreground">{actionLabel(log.resource_type)} · {new Date(log.created_at).toLocaleString()}</p>{log.error_message && <p className="mt-1 text-sm text-destructive">{log.error_message}</p>}</div><div className="flex items-center gap-3"><Badge variant={log.status === 'failure' ? 'destructive' : 'secondary'}>{log.status}</Badge>{log.ip_address && <span className="font-mono text-xs text-muted-foreground">{log.ip_address}</span>}</div></li>)}</ul></CardContent></Card>}
    </div>
  );
}
