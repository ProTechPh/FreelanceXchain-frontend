'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { auditLogsApi } from '@/lib/api';
import type { AuditLogEntry } from '@/types';
import { toast } from 'sonner';
import { Search, Loader2, User } from 'lucide-react';

const statusColors: Record<AuditLogEntry['status'], string> = {
  success: 'bg-success-subtle text-success',
  pending: 'bg-warning-subtle text-warning',
  failure: 'bg-destructive-subtle text-destructive',
};

const RANGE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [rangeDays, setRangeDays] = useState(7);
  const [failedOnly, setFailedOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (failedOnly) {
        const { data } = await auditLogsApi.getFailed(200);
        setLogs(data.logs);
      } else {
        const end = new Date();
        const start = new Date(end.getTime() - rangeDays * 24 * 60 * 60 * 1000);
        const { data } = await auditLogsApi.getByDateRange(start.toISOString(), end.toISOString());
        setLogs(data.logs);
      }
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [rangeDays, failedOnly]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const resourceTypes = useMemo(
    () => Array.from(new Set(logs.map((l) => l.resource_type))).sort(),
    [logs]
  );

  const filteredLogs = logs.filter((log) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      log.action.toLowerCase().includes(term) ||
      log.resource_type.toLowerCase().includes(term) ||
      (log.user_id ?? '').toLowerCase().includes(term);
    const matchesResource = resourceFilter === 'all' || log.resource_type === resourceFilter;
    return matchesSearch && matchesResource;
  });

  const successCount = logs.filter((l) => l.status === 'success').length;
  const pendingCount = logs.filter((l) => l.status === 'pending').length;
  const failureCount = logs.filter((l) => l.status === 'failure').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Audit logs</h1>
          <p className="text-muted-foreground">Track platform activity{failedOnly ? ' (failed actions)' : ` — last ${rangeDays} days`}</p>
        </div>
        <div className="flex gap-2">
          {RANGE_PRESETS.map((preset) => (
            <Button
              key={preset.days}
              variant={!failedOnly && rangeDays === preset.days ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => {
                setFailedOnly(false);
                setRangeDays(preset.days);
              }}
            >
              {preset.label}
            </Button>
          ))}
          <Button
            variant={failedOnly ? 'gradient' : 'outline'}
            size="sm"
            onClick={() => setFailedOnly((prev) => !prev)}
          >
            Failed only
          </Button>
        </div>
      </div>

      {/* Stats — reflect the currently loaded range/filter, not an all-time total */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{logs.length}</p>
            <p className="text-xs text-muted-foreground">Events Loaded</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-success">{successCount}</p>
            <p className="text-xs text-muted-foreground">Successful</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-warning">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-destructive">{failureCount}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search action, resource, or actor id..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={resourceFilter === 'all' ? 'gradient' : 'outline'}
            size="sm"
            onClick={() => setResourceFilter('all')}
          >
            All
          </Button>
          {resourceTypes.map((type) => (
            <Button
              key={type}
              variant={resourceFilter === type ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => setResourceFilter(type)}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Logs */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Action</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actor</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Resource</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">IP</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border hover:bg-secondary/30">
                      <td className="p-4">
                        <code className="text-sm bg-secondary px-2 py-1 rounded">{log.action}</code>
                        {log.error_message && (
                          <p className="text-xs text-destructive mt-1 max-w-xs truncate">{log.error_message}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-mono" title={log.actor_id ?? log.user_id ?? undefined}>
                            {(log.actor_id ?? log.user_id ?? 'system').slice(0, 8)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {log.resource_type}
                        {log.resource_id && <span className="font-mono text-xs"> #{log.resource_id.slice(0, 8)}</span>}
                      </td>
                      <td className="p-4">
                        <Badge className={statusColors[log.status]}>{log.status}</Badge>
                      </td>
                      <td className="p-4 text-sm font-mono text-muted-foreground">{log.ip_address ?? '-'}</td>
                      <td className="p-4 text-sm text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No audit log entries match your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
