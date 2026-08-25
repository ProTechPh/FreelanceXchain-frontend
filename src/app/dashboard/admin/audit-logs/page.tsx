'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { auditLogsApi } from '@/lib/api';
import type { AuditLogEntry } from '@/types';
import { toast } from 'sonner';
import { ClipboardList, Search, User } from 'lucide-react';
import { ListSkeleton } from '@/components/dashboard/skeletons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';

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
            <ListSkeleton rows={6} label="Loading audit logs" className="p-4" />
          ) : (
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <code className="text-sm bg-secondary px-2 py-1 rounded">{log.action}</code>
                        {log.error_message && (
                          <p className="text-xs text-destructive mt-1 max-w-xs truncate">{log.error_message}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-mono" title={log.actor_id ?? log.user_id ?? undefined}>
                            {(log.actor_id ?? log.user_id ?? 'system').slice(0, 8)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4 text-sm text-muted-foreground">
                        {log.resource_type}
                        {log.resource_id && <span className="font-mono text-xs"> #{log.resource_id.slice(0, 8)}</span>}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[log.status]}>{log.status}</Badge>
                      </TableCell>
                      <TableCell className="p-4 text-sm font-mono text-muted-foreground">{log.ip_address ?? '-'}</TableCell>
                      <TableCell className="p-4 text-sm text-muted-foreground">{new Date(log.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10">
                        <EmptyState
                          size="sm"
                          icon={ClipboardList}
                          title="No audit entries match your filters"
                          description="Try widening the date range or clearing the action filter."
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
